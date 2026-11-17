from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from users.views import CustomTokenObtainPairView, CustomTokenRefreshView

urlpatterns = [
    # Authentication and user-facing account APIs.
    path("users/", include("users.urls")),
    path("profiles/", include("profiles.urls")),
    path(
        "login/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "token/refresh/",
        CustomTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("account/", include("users.account_urls")),
    # Public catalog and reference data.
    path("categories/", include("categories.urls")),
    path("brands/", include("brands.urls")),
    path("colors/", include("colors.urls")),
    path("currencies/", include("currencies.urls")),
    path("discounts/", include("discounts.urls")),
    path("product-images/", include("product_images.urls")),
    path("sizes/", include("sizes.urls")),
    path("products/", include("products.urls")),
    path("product-variants/", include("product_variants.urls")),
    # Customer commerce.
    path("favorites/", include("favorites.urls")),
    path("shopping-cart/", include("shopping_cart.urls")),
    path("orders/", include("orders.urls")),
    # Staff-only management APIs.
    path("admin/", include("store_admin.urls")),
    # API documentation.
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path(
        "schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
