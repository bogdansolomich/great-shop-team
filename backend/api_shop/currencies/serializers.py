from rest_framework import serializers

from .models import Currency


class CurrencySerializer(serializers.ModelSerializer):
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    class Meta:
        model = Currency
        fields = (
            "id",
            "product_variant",
            "currency_code",
            "amount",
        )
