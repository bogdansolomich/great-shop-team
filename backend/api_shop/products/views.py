from django.db.models import Prefetch
from drf_spectacular.utils import OpenApiParameter, extend_schema
from product_variants.models import ProductVariant
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Product
from .serializers import ProductDetailSerializer, ProductSerializer

LANG_PARAMETER = OpenApiParameter(
    name="lang",
    type=str,
    location=OpenApiParameter.QUERY,
    required=False,
    enum=["uk", "en"],
    description=(
        "Language of name and description. "
        "uk is Ukrainian, en is English. "
        "An empty translation falls back to the original stored name."
    ),
)

PUBLIC_PRODUCTS = Product.objects.select_related(
    "brand",
    "subcategory",
    "subcategory__category",
).filter(is_active=True, is_hidden=False)


@extend_schema(parameters=[LANG_PARAMETER])
class ProductListAPIView(ListAPIView):
    queryset = PUBLIC_PRODUCTS
    serializer_class = ProductSerializer


@extend_schema(parameters=[LANG_PARAMETER])
class ProductRetrieveAPIView(RetrieveAPIView):
    queryset = PUBLIC_PRODUCTS.prefetch_related(
        Prefetch(
            "variants",
            queryset=ProductVariant.objects.filter(is_active=True)
            .select_related("size", "color")
            .prefetch_related("currencies", "images"),
        )
    )
    serializer_class = ProductDetailSerializer
