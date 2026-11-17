from currencies.models import Currency
from drf_spectacular.utils import extend_schema_field
from product_images.models import ProductImage
from product_variants.models import ProductVariant
from rest_framework import serializers
from django.utils import translation

from .models import Product


def request_language(serializer) -> str | None:
    request = serializer.context.get("request")
    if request is None:
        return "uk"

    # 1. Сначала проверяем query-параметр (?lang=en)
    lang = (request.query_params.get("lang") or "").strip().lower()
    if lang in {"uk", "en"}:
        return lang

    # 2. Проверяем заголовок Accept-Language, который шлет RTK Query
    header_lang = request.META.get("HTTP_ACCEPT_LANGUAGE", "").strip().lower()
    if header_lang.startswith("en"):
        return "en"
    if header_lang.startswith("uk"):
        return "uk"

    # 3. Проверяем активированный Django язык через мидлвару
    current_translation = translation.get_language()
    if current_translation in {"uk", "en"}:
        return current_translation

    return "uk"  # язык по умолчанию


def localized_text(lang: str | None, uk: str, en: str, legacy: str) -> tuple[str, bool]:
    """Pick a language. An empty translation falls back to the stored legacy text."""
    if lang == "uk":
        if uk:
            return uk, False
        return legacy, True
    if lang == "en":
        if en:
            return en, False
        return legacy, True
    return legacy, False


class CatalogPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ("currency_code", "amount")


class CatalogImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_main", "sort_order")


class CatalogVariantSerializer(serializers.ModelSerializer):
    size = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    prices = CatalogPriceSerializer(source="currencies", many=True, read_only=True)
    images = CatalogImageSerializer(many=True, read_only=True)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_size(self, obj):
        return obj.size.name if obj.size_id else None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_color(self, obj):
        return obj.color.name if obj.color_id else None

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "sku",
            "size",
            "color",
            "stock",
            "gender",
            "is_active",
            "prices",
            "images",
        )


class ProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField()
    subcategory_name = serializers.SerializerMethodField()
    category = serializers.IntegerField(
        source="subcategory.category_id", read_only=True
    )
    category_name = serializers.SerializerMethodField()
    translation_missing = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_brand_name(self, obj):
        if not obj.brand:
            return None
        lang = request_language(self)
        return localized_text(lang, obj.brand.name_uk, obj.brand.name_en, obj.brand.name)[0]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_subcategory_name(self, obj):
        if not obj.subcategory:
            return None
        lang = request_language(self)
        return localized_text(lang, obj.subcategory.name_uk, obj.subcategory.name_en, obj.subcategory.name)[0]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_category_name(self, obj):
        if not obj.subcategory or not obj.subcategory.category:
            return None
        lang = request_language(self)
        cat = obj.subcategory.category
        return localized_text(lang, cat.name_uk, cat.name_en, cat.name)[0]

    @extend_schema_field(serializers.BooleanField())
    def get_translation_missing(self, obj):
        lang = request_language(self)
        _, missing = localized_text(lang, obj.name_uk, obj.name_en, obj.name)
        return missing

    def to_representation(self, instance):
        data = super().to_representation(instance)
        lang = request_language(self)
        
        # Локализация названия и описания продукта
        name, _ = localized_text(lang, instance.name_uk, instance.name_en, instance.name)
        description, _ = localized_text(
            lang,
            instance.description_uk,
            instance.description_en,
            instance.description,
        )
        
        data["name"] = name
        data["description"] = description
        return data

    class Meta:
        model = Product
        fields = (
            "id",
            "product_code",
            "name",
            "name_uk",
            "name_en",
            "slug",
            "description",
            "description_uk",
            "description_en",
            "brand",
            "brand_name",
            "category",
            "category_name",
            "subcategory",
            "subcategory_name",
            "translation_missing",
            "is_active",
            "is_hidden",
        )


class ProductDetailSerializer(ProductSerializer):
    variants = CatalogVariantSerializer(many=True, read_only=True)

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ("variants",)