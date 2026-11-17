from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import Discount
from .serializers import DiscountSerializer


class DiscountListAPIView(ListCreateAPIView):
    serializer_class = DiscountSerializer

    def get_queryset(self):
        return Discount.objects.select_related("product_variant").all()

    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()


class DiscountRetrieveAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = DiscountSerializer

    def get_queryset(self):
        return Discount.objects.select_related("product_variant").all()

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()
