from decimal import Decimal, ROUND_HALF_UP

from currencies.services import price_subquery, resolve_currency_code
from django.db import transaction
from django.utils import timezone
from discounts.models import Discount
from product_variants.models import ProductVariant
from rest_framework import serializers
from shopping_cart.models import ShoppingCart

from .emails import send_order_confirmation
from .models import Order, OrderItem

CENT = Decimal("0.01")
WELCOME_PROMO_CODE = "WELCOME10"
WELCOME_PROMO_RATE = Decimal("0.10")


def _ensure_can_be_bought(
    variant,
    quantity: int,
    currency_code: str,
    *,
    for_guest: bool = False,
) -> None:
    if variant is None:
        detail = (
            "Product variant is not available."
            if for_guest
            else "Some items in the cart are no longer available."
        )
        raise serializers.ValidationError({"detail": detail})

    product = variant.product

    if not (variant.is_active and product.is_active and not product.is_hidden):
        raise serializers.ValidationError(
            {"detail": f"{variant.sku} is not available."}
        )

    if variant.unit_price is None or variant.unit_price <= 0:
        raise serializers.ValidationError(
            {"detail": f"{variant.sku} has no price in {currency_code}."}
        )

    if quantity > variant.stock:
        raise serializers.ValidationError(
            {
                "detail": (
                    f"Not enough stock for {variant.sku}: "
                    f"requested {quantity}, available {variant.stock}."
                )
            }
        )


def _lock_variants(variant_ids, currency_code: str) -> dict:
    # Always lock variants in id order to avoid deadlocks between checkouts.
    return {
        variant.pk: variant
        for variant in ProductVariant.objects.select_for_update(of=("self",))
        .select_related("product", "size", "color")
        .annotate(unit_price=price_subquery(currency_code, "pk"))
        .filter(pk__in=variant_ids)
        .order_by("pk")
    }


def _discounted_price(unit_price: Decimal, discounts, now) -> Decimal:
    current_prices = [unit_price]
    for discount in discounts:
        if not discount.is_active or discount.start_at > now or discount.end_at < now:
            continue

        amount = discount.amount
        discount_type = discount.discount_type.strip().lower()
        if "percent" in discount_type or discount_type in {"pct", "%"}:
            price = unit_price * (Decimal("1") - amount / Decimal("100"))
        elif "fix" in discount_type or "amount" in discount_type or "abs" in discount_type:
            price = unit_price - amount
        else:
            price = (
                unit_price * (Decimal("1") - amount / Decimal("100"))
                if amount <= 100
                else unit_price - amount
            )
        current_prices.append(max(Decimal("0"), price).quantize(CENT, rounding=ROUND_HALF_UP))

    return min(current_prices)


def _validate_promo_code(code: str, user, email: str) -> str:
    normalized_code = (code or "").strip().upper()
    if not normalized_code:
        return ""
    if normalized_code != WELCOME_PROMO_CODE:
        raise serializers.ValidationError(
            {"promo_code": ["Invalid promo code."]}
        )

    previous_orders = Order.objects.filter(email__iexact=email)
    if user is not None:
        previous_orders = previous_orders | Order.objects.filter(user=user)
    if previous_orders.exists():
        raise serializers.ValidationError(
            {"promo_code": ["WELCOME10 is valid only for your first order."]}
        )
    return normalized_code


def _place_order(
    *,
    user,
    email: str,
    data: dict,
    lines: list[tuple[int, int]],
    for_guest: bool = False,
) -> Order:
    """Create an order from ``lines`` of ``(variant_id, quantity)``.

    Caller must already be inside ``transaction.atomic``. Stock is reduced
    here. The cart, if any, is the caller's concern.
    """
    currency_code = resolve_currency_code(data.get("currency_code"))
    promo_code = _validate_promo_code(data.get("promo_code", ""), user, email)
    variants = _lock_variants([variant_id for variant_id, _ in lines], currency_code)
    discounts_by_variant = {}
    for discount in (
        Discount.objects.select_for_update()
        .filter(product_variant_id__in=variants)
        .order_by("id")
    ):
        discounts_by_variant.setdefault(discount.product_variant_id, []).append(discount)
    now = timezone.now()

    order_items = []
    total_amount = Decimal("0.00")
    promo_eligible_subtotal = Decimal("0.00")

    for variant_id, quantity in lines:
        variant = variants.get(variant_id)
        _ensure_can_be_bought(
            variant, quantity, currency_code, for_guest=for_guest
        )

        unit_price = _discounted_price(
            variant.unit_price,
            discounts_by_variant.get(variant_id, ()),
            now,
        )
        line_total = unit_price * quantity
        total_amount += line_total
        if unit_price == variant.unit_price:
            promo_eligible_subtotal += line_total

        order_items.append(
            OrderItem(
                product_variant=variant,
                product_name=variant.product.name,
                sku=variant.sku,
                size=variant.size.name if variant.size_id else "",
                color=variant.color.name if variant.color_id else "",
                unit_price=unit_price,
                quantity=quantity,
                line_total=line_total,
            )
        )

        variant.stock -= quantity

    promo_discount = Decimal("0.00")
    if promo_code:
        if promo_eligible_subtotal <= 0:
            raise serializers.ValidationError(
                {"promo_code": ["WELCOME10 does not apply to sale items."]}
            )
        promo_discount = (promo_eligible_subtotal * WELCOME_PROMO_RATE).quantize(
            CENT,
            rounding=ROUND_HALF_UP,
        )
        total_amount -= promo_discount

    order = Order.objects.create(
        user=user,
        email=email,
        currency_code=currency_code,
        total_amount=total_amount,
        promo_code=promo_code,
        promo_discount=promo_discount,
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=data["phone"],
        shipping_address=data["shipping_address"],
        comment=data.get("comment", ""),
    )

    for order_item in order_items:
        order_item.order = order

    OrderItem.objects.bulk_create(order_items)

    for variant in variants.values():
        variant.save(update_fields=["stock", "updated_at"])

    return order


@transaction.atomic
def create_order_from_cart(user, data: dict) -> Order:
    """Turn the whole cart of ``user`` into an order.

    Everything runs in one transaction. The cart row and the variant rows are
    locked, so two checkouts can neither sell the same last unit twice nor
    build two orders from one cart. Any problem aborts the transaction and the
    cart and the stock stay untouched.
    """
    # Resolve before taking the cart lock, so a bad currency code fails fast.
    resolve_currency_code(data.get("currency_code"))

    # Lock the cart first: a double-clicked "Place order" waits here and then
    # finds an empty cart instead of creating a duplicate order.
    cart = ShoppingCart.objects.select_for_update().filter(user=user).first()
    cart_items = list(cart.items.filter(quantity__gt=0).order_by("id")) if cart else []

    if not cart_items:
        raise serializers.ValidationError({"detail": "Cart is empty."})

    order = _place_order(
        user=user,
        email=user.email,
        data=data,
        lines=[(item.product_variant_id, item.quantity) for item in cart_items],
    )
    cart.items.all().delete()
    send_order_confirmation(
        order,
        language=data.get("language"),
        payment_method=data.get("payment_method"),
    )
    return order


@transaction.atomic
def create_guest_order(data: dict, user=None) -> Order:
    """Place the lines from the request for a visitor, or for a browser cart.

    ``data["lines"]`` is a list of ``(variant_id, quantity)``. The variant
    rows are locked in the same transaction as the stock update and the
    confirmation email. If the email cannot be sent, the order is rolled back.
    """
    order = _place_order(
        user=user,
        email=data["email"],
        data=data,
        lines=data["lines"],
        for_guest=user is None,
    )
    send_order_confirmation(
        order,
        language=data.get("language"),
        payment_method=data.get("payment_method"),
    )
    return order
