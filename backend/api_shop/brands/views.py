from rest_framework.generics import ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import Brand
from .serializers import BrandSerializer


class BrandListAPIView(ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()


class BrandRetrieveAPIView(RetrieveAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
