from rest_framework import serializers

from .models import ProductVariant
from .validation import catalog_errors


class ProductVariantSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        product = attrs.get("product", getattr(self.instance, "product", None))
        if product is None:
            return attrs

        size = attrs.get("size", getattr(self.instance, "size", None))
        color = attrs.get("color", getattr(self.instance, "color", None))
        gender = attrs.get("gender", getattr(self.instance, "gender", "unisex"))
        errors = catalog_errors(
            product=product,
            size=size,
            color=color,
            gender=gender,
        )
        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "product",
            "size",
            "color",
            "sku",
            "stock",
            "gender",
            "is_active",
        )
