from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = (
        "product_name",
        "sku",
        "size",
        "color",
        "unit_price",
        "quantity",
        "line_total",
    )
    readonly_fields = (
        "product_name",
        "sku",
        "size",
        "color",
        "unit_price",
        "quantity",
        "line_total",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Orders are created through checkout. Staff may change only the status."""

    list_display = (
        "id",
        "user",
        "status",
        "currency_code",
        "total_amount",
        "promo_code",
        "promo_discount",
        "created_at",
    )
    list_editable = ("status",)
    list_filter = (
        "status",
        "currency_code",
    )
    search_fields = (
        "email",
        "phone",
        "last_name",
    )
    fields = (
        "status",
        "user",
        "email",
        "first_name",
        "last_name",
        "phone",
        "shipping_address",
        "comment",
        "currency_code",
        "total_amount",
        "promo_code",
        "promo_discount",
        "created_at",
        "updated_at",
    )
    readonly_fields = (
        "user",
        "email",
        "first_name",
        "last_name",
        "phone",
        "shipping_address",
        "comment",
        "currency_code",
        "total_amount",
        "promo_code",
        "promo_discount",
        "created_at",
        "updated_at",
    )
    list_select_related = ("user",)
    inlines = (OrderItemInline,)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
