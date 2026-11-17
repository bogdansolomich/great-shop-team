from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import Currency
from .serializers import CurrencySerializer

PUBLIC_PRICES = Currency.objects.select_related(
    "product_variant",
    "product_variant__product",
).filter(
    product_variant__is_active=True,
    product_variant__product__is_active=True,
    product_variant__product__is_hidden=False,
)


class CurrencyListAPIView(ListCreateAPIView):
    serializer_class = CurrencySerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Currency.objects.select_related("product_variant").all()
        return PUBLIC_PRICES

    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()


class CurrencyRetrieveAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = CurrencySerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Currency.objects.select_related("product_variant").all()
        return PUBLIC_PRICES

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()
