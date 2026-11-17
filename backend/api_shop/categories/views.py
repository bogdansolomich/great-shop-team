from rest_framework.generics import ListAPIView, RetrieveAPIView

from categories.models import Category, Subcategory
from categories.serializers import (
    CategorySerializer,
    SubcategorySerializer,
)

PUBLIC_CATEGORIES = Category.objects.filter(is_active=True, is_hidden=False)
PUBLIC_SUBCATEGORIES = Subcategory.objects.select_related("category").filter(
    is_active=True,
    is_hidden=False,
    category__is_active=True,
    category__is_hidden=False,
)


class CategoryListAPIView(ListAPIView):
    queryset = PUBLIC_CATEGORIES
    serializer_class = CategorySerializer


class CategoryRetrieveAPIView(RetrieveAPIView):
    queryset = PUBLIC_CATEGORIES
    serializer_class = CategorySerializer


class SubcategoryListAPIView(ListAPIView):
    queryset = PUBLIC_SUBCATEGORIES
    serializer_class = SubcategorySerializer


class SubcategoryRetrieveAPIView(RetrieveAPIView):
    queryset = PUBLIC_SUBCATEGORIES
    serializer_class = SubcategorySerializer
