from profiles.validators import validate_phone
from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_variant",
            "product_name",
            "sku",
            "size",
            "color",
            "unit_price",
            "quantity",
            "line_total",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "currency_code",
            "total_amount",
            "promo_code",
            "promo_discount",
            "first_name",
            "last_name",
            "phone",
            "email",
            "shipping_address",
            "comment",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderLineInputSerializer(serializers.Serializer):
    product_variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    """Checkout form for an authenticated user.

    The items come from the user's cart, not from the body, unless the
    client sends ``items`` (the storefront cart lives in the browser).
    """

    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(
        max_length=16,
        validators=[validate_phone],
        help_text="International format, e.g. +380501234567.",
    )
    shipping_address = serializers.CharField(max_length=500)
    promo_code = serializers.CharField(
        max_length=32,
        required=False,
        allow_blank=True,
    )
    comment = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
    )
    currency_code = serializers.CharField(
        min_length=3,
        max_length=3,
        required=False,
        help_text=(
            "Currency to price the order in, e.g. UAH. Defaults to the store "
            "currency. Every item must have a price in it."
        ),
    )
    language = serializers.ChoiceField(
        choices=("uk", "en"),
        required=False,
        default="uk",
        help_text="Language of the confirmation email. Ukrainian when omitted.",
    )
    payment_method = serializers.ChoiceField(
        choices=("google", "visa", "mastercard"),
        required=False,
        allow_blank=True,
        default="",
        help_text="Payment method shown in the confirmation email.",
    )


class GuestOrderCreateSerializer(OrderCreateSerializer):
    """Checkout form for a visitor, or for a browser cart sent as ``items``.

    A single line can still be sent as ``product_variant_id`` and ``quantity``.
    Several lines use ``items``. One of the two shapes is required.
    """

    email = serializers.EmailField()
    product_variant_id = serializers.IntegerField(min_value=1, required=False)
    quantity = serializers.IntegerField(min_value=1, required=False)
    items = OrderLineInputSerializer(many=True, required=False)

    def validate(self, attrs):
        items = attrs.get("items") or []
        if items:
            attrs["lines"] = [
                (item["product_variant_id"], item["quantity"]) for item in items
            ]
            return attrs

        variant_id = attrs.get("product_variant_id")
        quantity = attrs.get("quantity")
        if not variant_id or not quantity:
            errors = {}
            if not variant_id:
                errors["product_variant_id"] = ["This field is required."]
            if not quantity:
                errors["quantity"] = ["This field is required."]
            raise serializers.ValidationError(errors)

        attrs["lines"] = [(variant_id, quantity)]
        return attrs
