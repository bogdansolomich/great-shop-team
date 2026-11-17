from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
)
from rest_framework import mixins, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from .emails import EmailSendError
from .models import Order
from .serializers import (
    GuestOrderCreateSerializer,
    OrderCreateSerializer,
    OrderSerializer,
)
from .services import create_guest_order, create_order_from_cart

ORDER_EXAMPLE = {
    "id": 1,
    "status": "PENDING",
    "currency_code": "UAH",
    "total_amount": "3000.00",
    "promo_code": "",
    "promo_discount": "0.00",
    "first_name": "Ivan",
    "last_name": "Petrenko",
    "phone": "+380501234567",
    "email": "customer@example.com",
    "shipping_address": "Kyiv, Khreshchatyk St, 1",
    "comment": "Call before delivery",
    "items": [
        {
            "id": 1,
            "product_variant": 1,
            "product_name": "Test T-Shirt",
            "sku": "TEST-TSHIRT-M-BLK",
            "size": "M",
            "color": "Black",
            "unit_price": "1500.00",
            "quantity": 2,
            "line_total": "3000.00",
        }
    ],
    "created_at": "2026-10-27T17:30:00Z",
    "updated_at": "2026-10-27T17:30:00Z",
}


@extend_schema_view(
    list=extend_schema(
        summary="List my orders",
        description="Orders of the current user, newest first.",
    ),
    retrieve=extend_schema(
        summary="Get one of my orders",
        description="Other users' orders are not visible (404).",
    ),
    create=extend_schema(
        summary="Place an order",
        description=(
            "One checkout for two callers. With a Bearer token, the whole cart "
            "of the current user becomes the order and the cart is emptied; "
            "send OrderCreate (no email and no variant — those come from the "
            "account and the cart). Without a token, send GuestOrderCreate: "
            "there is no cart, so the body must include email and either "
            "items (several variants) or product_variant_id and quantity "
            "for a single variant. The same items shape is accepted for a "
            "logged-in buyer whose cart lives in the browser. The WELCOME10 "
            "promo code gives 10% off eligible full-price items on the first "
            "order only and does not stack with variant sales; the server "
            "validates the code and calculates its discount. "
            "email is sent to the address on the order, in Ukrainian unless "
            "language is \"en\". If the email cannot be sent, the order is "
            "not saved. Product "
            "name, SKU, size, color and unit price are copied into the order "
            "at this moment, so later catalog changes do not affect it. Stock "
            "is reduced in the same transaction: if any item is unavailable, "
            "has no price in the currency or exceeds the stock, nothing is "
            "changed. A guest order has no cart to clear. Do not send an "
            "expired token for a guest checkout — an invalid token is rejected "
            "before the order is created."
        ),
        request=PolymorphicProxySerializer(
            component_name="OrderCheckoutRequest",
            serializers=[OrderCreateSerializer, GuestOrderCreateSerializer],
            resource_type_field_name=None,
        ),
        responses={
            201: OrderSerializer,
            400: OpenApiResponse(
                description=(
                    "Invalid fields (per-field errors), or the order cannot be "
                    'placed: {"detail": "Cart is empty." | "Product variant is '
                    'not available." | "<SKU> is not available." | "<SKU> has '
                    'no price in UAH." | "Not enough stock for <SKU>: '
                    'requested 5, available 2."}'
                ),
            ),
            401: OpenApiResponse(
                description="Bearer token was sent but is invalid or expired.",
            ),
        },
        examples=[
            OpenApiExample(
                "Authenticated checkout",
                value={
                    "first_name": "Ivan",
                    "last_name": "Petrenko",
                    "phone": "+380501234567",
                    "shipping_address": "Kyiv, Khreshchatyk St, 1",
                    "comment": "Call before delivery",
                    "currency_code": "UAH",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Guest checkout",
                value={
                    "first_name": "John",
                    "last_name": "Doe",
                    "phone": "+380501234567",
                    "email": "john@example.com",
                    "shipping_address": "Kyiv, Khreshchatyk St, 1",
                    "product_variant_id": 1,
                    "quantity": 2,
                    "currency_code": "UAH",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Created order",
                value=ORDER_EXAMPLE,
                response_only=True,
                status_codes=["201"],
            ),
        ],
    ),
)
class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()

        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    def create(self, request, *args, **kwargs):
        payload = request.data if isinstance(request.data, dict) else {}
        # A browser cart is not the server cart, so explicit lines win even
        # when the buyer is logged in.
        use_request_lines = (not request.user.is_authenticated) or bool(
            payload.get("items")
        )

        try:
            if use_request_lines:
                serializer = GuestOrderCreateSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                user = request.user if request.user.is_authenticated else None
                order = create_guest_order(serializer.validated_data, user=user)
            else:
                serializer = OrderCreateSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                order = create_order_from_cart(
                    request.user, serializer.validated_data
                )
        except EmailSendError:
            return Response(
                {"detail": "Could not send the order email."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
