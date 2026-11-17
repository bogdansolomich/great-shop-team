from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import ProductImage
from .serializers import ProductImageSerializer

PUBLIC_IMAGES = ProductImage.objects.select_related(
    "product_variant",
    "product_variant__product",
).filter(
    product_variant__is_active=True,
    product_variant__product__is_active=True,
    product_variant__product__is_hidden=False,
)


class ProductImageListAPIView(ListAPIView):
    queryset = PUBLIC_IMAGES
    serializer_class = ProductImageSerializer


class ProductImageRetrieveAPIView(RetrieveAPIView):
    queryset = PUBLIC_IMAGES
    serializer_class = ProductImageSerializer
