from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import ProductVariant
from .serializers import ProductVariantSerializer

PUBLIC_VARIANTS = ProductVariant.objects.select_related(
    "product", "size", "color"
).filter(
    is_active=True,
    product__is_active=True,
    product__is_hidden=False,
)


class ProductVariantListAPIView(ListCreateAPIView):
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return ProductVariant.objects.select_related("product", "size", "color").all()
        return PUBLIC_VARIANTS

    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()


class ProductVariantRetrieveAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return ProductVariant.objects.select_related("product", "size", "color").all()
        return PUBLIC_VARIANTS

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()
