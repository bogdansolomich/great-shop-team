from django.urls import path

from .views import (
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminOrderDetailView,
    AdminOrderListView,
    AdminOrderStatusView,
    AdminProductDetailView,
    AdminProductImageDeleteView,
    AdminProductImageUploadView,
    AdminProductListCreateView,
    AdminSubcategoryDetailView,
    AdminSubcategoryListCreateView,
)

urlpatterns = [
    path("products/", AdminProductListCreateView.as_view(), name="admin-products"),
    path(
        "products/<int:pk>/",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),
    path(
        "categories/",
        AdminCategoryListCreateView.as_view(),
        name="admin-categories",
    ),
    path(
        "categories/<int:pk>/",
        AdminCategoryDetailView.as_view(),
        name="admin-category-detail",
    ),
    path(
        "subcategories/",
        AdminSubcategoryListCreateView.as_view(),
        name="admin-subcategories",
    ),
    path(
        "subcategories/<int:pk>/",
        AdminSubcategoryDetailView.as_view(),
        name="admin-subcategory-detail",
    ),
    path("orders/", AdminOrderListView.as_view(), name="admin-orders"),
    path(
        "orders/<int:pk>/",
        AdminOrderDetailView.as_view(),
        name="admin-order-detail",
    ),
    path(
        "orders/<int:pk>/status/",
        AdminOrderStatusView.as_view(),
        name="admin-order-status",
    ),
    path(
        "product-images/",
        AdminProductImageUploadView.as_view(),
        name="admin-product-images",
    ),
    path(
        "product-images/<int:pk>/",
        AdminProductImageDeleteView.as_view(),
        name="admin-product-image-detail",
    ),
]
