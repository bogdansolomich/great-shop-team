from categories.models import Category, Subcategory
from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from orders.models import Order
from orders.serializers import OrderSerializer
from product_images.models import ProductImage
from product_variants.models import ProductVariant
from products.models import Product
from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AdminCategorySerializer,
    AdminCategoryWriteSerializer,
    AdminOrderStatusSerializer,
    AdminProductImageSerializer,
    AdminProductImageUpdateSerializer,
    AdminProductImageUploadSerializer,
    AdminProductSerializer,
    AdminProductWriteSerializer,
    AdminSubcategorySerializer,
    AdminSubcategoryWriteSerializer,
)

ADMIN_PERMISSIONS = [IsAuthenticated, IsAdminUser]


def admin_products():
    return Product.objects.select_related(
        "brand",
        "subcategory",
        "subcategory__category",
    ).prefetch_related(
        Prefetch(
            "variants",
            queryset=ProductVariant.objects.select_related("size", "color")
            .prefetch_related("currencies", "images")
            .order_by("id"),
        )
    )


def _read(serializer_class, instance, request):
    return serializer_class(instance, context={"request": request}).data


@extend_schema_view(
    get=extend_schema(summary="List products with both translations"),
    post=extend_schema(
        summary="Create a product",
        request=AdminProductWriteSerializer,
        responses={201: AdminProductSerializer},
    ),
)
class AdminProductListCreateView(ListCreateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminProductSerializer
    queryset = admin_products()

    def get_queryset(self):
        return admin_products().filter(is_hidden=False)

    def create(self, request, *args, **kwargs):
        write = AdminProductWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        product = write.save()
        product = self.get_queryset().get(pk=product.pk)
        return Response(_read(AdminProductSerializer, product, request), status=201)


@extend_schema_view(
    get=extend_schema(summary="Product with both translations and variants"),
    patch=extend_schema(
        summary="Edit translations and shared product fields",
        request=AdminProductWriteSerializer,
        responses={200: AdminProductSerializer},
    ),
    delete=extend_schema(summary="Hide the product from the public catalog"),
)
class AdminProductDetailView(RetrieveUpdateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminProductSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return admin_products()

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        write = AdminProductWriteSerializer(
            product,
            data=request.data,
            partial=True,
        )
        write.is_valid(raise_exception=True)
        product = write.save()
        product = self.get_queryset().get(pk=product.pk)
        return Response(_read(AdminProductSerializer, product, request))

    def delete(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.is_hidden = True
        product.save(update_fields=["is_active", "is_hidden", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(summary="List categories with both translations"),
    post=extend_schema(
        summary="Create a category",
        request=AdminCategoryWriteSerializer,
        responses={201: AdminCategorySerializer},
    ),
)
class AdminCategoryListCreateView(ListCreateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()

    def create(self, request, *args, **kwargs):
        write = AdminCategoryWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        category = write.save()
        return Response(
            _read(AdminCategorySerializer, category, request),
            status=201,
        )


class AdminCategoryDetailView(RetrieveUpdateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()
    http_method_names = ["get", "patch", "head", "options"]

    def update(self, request, *args, **kwargs):
        category = self.get_object()
        write = AdminCategoryWriteSerializer(
            category,
            data=request.data,
            partial=True,
        )
        write.is_valid(raise_exception=True)
        category = write.save()
        return Response(_read(AdminCategorySerializer, category, request))


@extend_schema_view(
    post=extend_schema(
        summary="Create a subcategory",
        request=AdminSubcategoryWriteSerializer,
        responses={201: AdminSubcategorySerializer},
    ),
)
class AdminSubcategoryListCreateView(ListCreateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminSubcategorySerializer
    queryset = Subcategory.objects.select_related("category")

    def create(self, request, *args, **kwargs):
        write = AdminSubcategoryWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        subcategory = write.save()
        return Response(
            _read(AdminSubcategorySerializer, subcategory, request),
            status=201,
        )


class AdminSubcategoryDetailView(RetrieveUpdateAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = AdminSubcategorySerializer
    queryset = Subcategory.objects.select_related("category")
    http_method_names = ["get", "patch", "head", "options"]

    def update(self, request, *args, **kwargs):
        subcategory = self.get_object()
        write = AdminSubcategoryWriteSerializer(
            subcategory,
            data=request.data,
            partial=True,
        )
        write.is_valid(raise_exception=True)
        subcategory = write.save()
        return Response(_read(AdminSubcategorySerializer, subcategory, request))


class AdminOrderListView(ListAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = OrderSerializer
    queryset = Order.objects.prefetch_related("items")


class AdminOrderDetailView(RetrieveAPIView):
    permission_classes = ADMIN_PERMISSIONS
    serializer_class = OrderSerializer
    queryset = Order.objects.prefetch_related("items")


class AdminOrderStatusView(APIView):
    permission_classes = ADMIN_PERMISSIONS

    @extend_schema(
        summary="Change an order status",
        request=AdminOrderStatusSerializer,
        responses={200: OrderSerializer},
    )
    def patch(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items"), pk=pk)
        write = AdminOrderStatusSerializer(order, data=request.data, partial=True)
        write.is_valid(raise_exception=True)
        order = write.save()
        return Response(OrderSerializer(order).data)


class AdminProductImageUploadView(APIView):
    permission_classes = ADMIN_PERMISSIONS

    @extend_schema(
        summary="Upload a product photo",
        request=AdminProductImageUploadSerializer,
        responses={201: AdminProductImageSerializer},
    )
    def post(self, request):
        write = AdminProductImageUploadSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        image = write.save()
        return Response(
            _read(AdminProductImageSerializer, image, request),
            status=201,
        )


class AdminProductImageDeleteView(APIView):
    permission_classes = ADMIN_PERMISSIONS

    @extend_schema(
        summary="Change the variant assigned to a product photo",
        request=AdminProductImageUpdateSerializer,
        responses={200: AdminProductImageSerializer},
    )
    def patch(self, request, pk):
        image = get_object_or_404(ProductImage, pk=pk)
        write = AdminProductImageUpdateSerializer(
            image,
            data=request.data,
            partial=True,
        )
        write.is_valid(raise_exception=True)
        with transaction.atomic():
            variant = write.validated_data.get(
                "product_variant",
                image.product_variant,
            )
            if write.validated_data.get("is_main", image.is_main):
                ProductImage.objects.filter(
                    product_variant=variant,
                    is_main=True,
                ).exclude(pk=image.pk).update(is_main=False)
            image = write.save()
        return Response(_read(AdminProductImageSerializer, image, request))

    def delete(self, request, pk):
        image = get_object_or_404(ProductImage, pk=pk)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
