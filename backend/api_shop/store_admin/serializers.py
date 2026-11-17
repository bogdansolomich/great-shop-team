from brands.models import Brand
from categories.models import Category, Subcategory
from django.db import IntegrityError, transaction
from django.utils.text import slugify
from orders.models import OrderStatus
from product_images.models import ProductImage
from product_variants.models import ProductVariant
from products.models import Product
from products.serializers import CatalogVariantSerializer
from rest_framework import serializers
from rest_framework.exceptions import APIException

MAX_IMAGE_BYTES = 15 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class CatalogAPIError(APIException):
    status_code = 400

    def __init__(self, code, details):
        super().__init__(detail={"code": code, "details": details})


def catalog_status(obj) -> str:
    if obj.is_active and not obj.is_hidden:
        return "ACTIVE"
    return "DRAFT"


def missing_product_translations(product) -> list[str]:
    missing = []
    if not product.name_uk:
        missing.append("name.uk")
    if not product.name_en:
        missing.append("name.en")
    if not product.description_uk:
        missing.append("description.uk")
    if not product.description_en:
        missing.append("description.en")
    return missing


def missing_name_translations(obj) -> list[str]:
    missing = []
    if not obj.name_uk:
        missing.append("name.uk")
    if not obj.name_en:
        missing.append("name.en")
    return missing


def _text(payload, key, current):
    if key in payload:
        return payload[key].strip()
    return current


def _require_product_translations(name_uk, name_en, description_uk, description_en):
    missing = []
    if not name_uk:
        missing.append("name.uk")
    if not name_en:
        missing.append("name.en")
    if not description_uk:
        missing.append("description.uk")
    if not description_en:
        missing.append("description.en")
    if missing:
        raise CatalogAPIError("translations_required", missing)


def _require_names(name_uk, name_en):
    missing = []
    if not name_uk:
        missing.append("name.uk")
    if not name_en:
        missing.append("name.en")
    if missing:
        raise CatalogAPIError("translations_required", missing)


def unique_slug(model, value, exclude_pk=None):
    base = slugify(value) or "item"
    slug = base
    number = 1
    existing = model.objects.all()
    if exclude_pk is not None:
        existing = existing.exclude(pk=exclude_pk)
    while existing.filter(slug=slug).exists():
        slug = f"{base}-{number}"
        number += 1
    return slug


def _save_model(instance, slug_field="slug"):
    try:
        with transaction.atomic():
            instance.save()
    except IntegrityError as exc:
        text = str(exc).lower()
        if "slug" in text:
            code = "slug_taken"
            details = [slug_field]
        elif "product_code" in text:
            code = "product_code_taken"
            details = ["product_code"]
        elif "name" in text:
            code = "name_taken"
            details = ["name"]
        else:
            raise
        raise CatalogAPIError(code, details) from exc
    return instance


class LocalizedTextSerializer(serializers.Serializer):
    uk = serializers.CharField(required=False, allow_blank=True, max_length=500)
    en = serializers.CharField(required=False, allow_blank=True, max_length=500)


class AdminProductSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    missing_translations = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(
        source="subcategory.category_id",
        read_only=True,
    )
    variants = CatalogVariantSerializer(many=True, read_only=True)

    def get_name(self, obj):
        return {"uk": obj.name_uk, "en": obj.name_en}

    def get_description(self, obj):
        return {"uk": obj.description_uk, "en": obj.description_en}

    def get_missing_translations(self, obj):
        return missing_product_translations(obj)

    def get_status(self, obj):
        return catalog_status(obj)

    class Meta:
        model = Product
        fields = (
            "id",
            "product_code",
            "slug",
            "name",
            "description",
            "missing_translations",
            "category_id",
            "subcategory",
            "brand",
            "status",
            "is_hidden",
            "variants",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminProductWriteSerializer(serializers.Serializer):
    name = LocalizedTextSerializer(required=False)
    description = LocalizedTextSerializer(required=False)
    subcategory = serializers.PrimaryKeyRelatedField(
        queryset=Subcategory.objects.all(),
        required=False,
    )
    brand = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        required=False,
    )
    slug = serializers.SlugField(required=False, allow_blank=True)
    product_code = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=50,
    )
    status = serializers.ChoiceField(choices=("ACTIVE", "DRAFT"), required=False)

    def validate(self, attrs):
        creating = self.instance is None
        if creating and "subcategory" not in attrs:
            raise serializers.ValidationError(
                {"subcategory": "This field is required."}
            )
        if creating and "brand" not in attrs:
            raise serializers.ValidationError({"brand": "This field is required."})

        current_name_uk = "" if creating else self.instance.name_uk
        current_name_en = "" if creating else self.instance.name_en
        current_description_uk = "" if creating else self.instance.description_uk
        current_description_en = "" if creating else self.instance.description_en
        name = attrs.get("name") or {}
        description = attrs.get("description") or {}
        name_uk = _text(name, "uk", current_name_uk)
        name_en = _text(name, "en", current_name_en)
        description_uk = _text(description, "uk", current_description_uk)
        description_en = _text(description, "en", current_description_en)
        if len(description_uk) > 500 or len(description_en) > 500:
            raise CatalogAPIError("description_too_long", ["description"])
        if len(name_uk) > 255 or len(name_en) > 255:
            raise CatalogAPIError("name_too_long", ["name"])
        if creating and not name_uk and not name_en:
            raise CatalogAPIError("name_required", ["name.uk", "name.en"])

        status = attrs.get("status")
        if status is None:
            status = "DRAFT" if creating else catalog_status(self.instance)
        if status == "ACTIVE":
            _require_product_translations(
                name_uk, name_en, description_uk, description_en
            )

        if creating:
            code = attrs.get("product_code")
        else:
            code = attrs.get("product_code", self.instance.product_code)
        if isinstance(code, str):
            code = code.strip() or None
        slug = attrs.get("slug", "" if creating else self.instance.slug).strip()
        if not slug:
            slug = unique_slug(
                Product,
                name_en or name_uk or (code or "product"),
                None if creating else self.instance.pk,
            )
        attrs["_resolved"] = {
            "name_uk": name_uk,
            "name_en": name_en,
            "description_uk": description_uk,
            "description_en": description_en,
            "name": name_uk or name_en,
            "description": description_uk or description_en,
            "status": status,
            "slug": slug,
            "product_code": code,
        }
        return attrs

    def create(self, validated_data):
        resolved = validated_data["_resolved"]
        product = Product(
            name=resolved["name"],
            name_uk=resolved["name_uk"],
            name_en=resolved["name_en"],
            description=resolved["description"],
            description_uk=resolved["description_uk"],
            description_en=resolved["description_en"],
            slug=resolved["slug"],
            product_code=resolved["product_code"],
            brand=validated_data["brand"],
            subcategory=validated_data["subcategory"],
            is_active=resolved["status"] == "ACTIVE",
            is_hidden=False,
        )
        return _save_model(product)

    def update(self, instance, validated_data):
        resolved = validated_data["_resolved"]
        instance.name = resolved["name"] or instance.name
        instance.name_uk = resolved["name_uk"]
        instance.name_en = resolved["name_en"]
        instance.description = resolved["description"]
        instance.description_uk = resolved["description_uk"]
        instance.description_en = resolved["description_en"]
        instance.slug = resolved["slug"]
        instance.product_code = resolved["product_code"]
        if "brand" in validated_data:
            instance.brand = validated_data["brand"]
        if "subcategory" in validated_data:
            instance.subcategory = validated_data["subcategory"]
        instance.is_active = resolved["status"] == "ACTIVE"
        if resolved["status"] == "ACTIVE":
            instance.is_hidden = False
        return _save_model(instance)


class AdminCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    missing_translations = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_name(self, obj):
        return {"uk": obj.name_uk, "en": obj.name_en}

    def get_missing_translations(self, obj):
        return missing_name_translations(obj)

    def get_status(self, obj):
        return catalog_status(obj)

    class Meta:
        model = Category
        fields = (
            "id",
            "slug",
            "name",
            "missing_translations",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminCategoryWriteSerializer(serializers.Serializer):
    name = LocalizedTextSerializer(required=False)
    slug = serializers.SlugField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=("ACTIVE", "DRAFT"), required=False)

    def validate(self, attrs):
        return _validate_named(
            self.instance,
            Category,
            attrs,
            require_parent=False,
        )

    def create(self, validated_data):
        resolved = validated_data["_resolved"]
        category = Category(
            name=resolved["name"],
            name_uk=resolved["name_uk"],
            name_en=resolved["name_en"],
            slug=resolved["slug"],
            is_active=resolved["status"] == "ACTIVE",
            is_hidden=False,
        )
        return _save_model(category)

    def update(self, instance, validated_data):
        return _apply_named(instance, validated_data)


class AdminSubcategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    missing_translations = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_name(self, obj):
        return {"uk": obj.name_uk, "en": obj.name_en}

    def get_missing_translations(self, obj):
        return missing_name_translations(obj)

    def get_status(self, obj):
        return catalog_status(obj)

    class Meta:
        model = Subcategory
        fields = (
            "id",
            "category",
            "slug",
            "name",
            "missing_translations",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminSubcategoryWriteSerializer(serializers.Serializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
    )
    name = LocalizedTextSerializer(required=False)
    slug = serializers.SlugField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=("ACTIVE", "DRAFT"), required=False)

    def validate(self, attrs):
        creating = self.instance is None
        if creating and "category" not in attrs:
            raise serializers.ValidationError({"category": "This field is required."})
        return _validate_named(self.instance, Subcategory, attrs, require_parent=False)

    def create(self, validated_data):
        resolved = validated_data["_resolved"]
        subcategory = Subcategory(
            category=validated_data["category"],
            name=resolved["name"],
            name_uk=resolved["name_uk"],
            name_en=resolved["name_en"],
            slug=resolved["slug"],
            is_active=resolved["status"] == "ACTIVE",
            is_hidden=False,
        )
        return _save_model(subcategory)

    def update(self, instance, validated_data):
        if "category" in validated_data:
            instance.category = validated_data["category"]
        return _apply_named(instance, validated_data)


def _validate_named(instance, model, attrs, require_parent):
    del require_parent
    creating = instance is None
    name = attrs.get("name") or {}
    name_uk = _text(name, "uk", "" if creating else instance.name_uk)
    name_en = _text(name, "en", "" if creating else instance.name_en)
    if len(name_uk) > 255 or len(name_en) > 255:
        raise CatalogAPIError("name_too_long", ["name"])
    status = attrs.get("status")
    if status is None:
        status = "ACTIVE" if creating else catalog_status(instance)
    if creating or status == "ACTIVE" or "name" in attrs:
        _require_names(name_uk, name_en)
    slug = attrs.get("slug", "" if creating else instance.slug).strip()
    if not slug:
        slug = unique_slug(
            model,
            name_en or name_uk,
            None if creating else instance.pk,
        )
    attrs["_resolved"] = {
        "name_uk": name_uk,
        "name_en": name_en,
        "name": name_uk or name_en,
        "slug": slug,
        "status": status,
    }
    return attrs


def _apply_named(instance, validated_data):
    resolved = validated_data["_resolved"]
    instance.name = resolved["name"] or instance.name
    instance.name_uk = resolved["name_uk"]
    instance.name_en = resolved["name_en"]
    instance.slug = resolved["slug"]
    instance.is_active = resolved["status"] == "ACTIVE"
    if resolved["status"] == "ACTIVE":
        instance.is_hidden = False
    return _save_model(instance)


class AdminOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.save(update_fields=["status", "updated_at"])
        return instance


class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "product_variant", "image", "is_main", "sort_order")
        read_only_fields = ("id", "image")


class AdminProductImageUploadSerializer(serializers.Serializer):
    product_variant = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all()
    )
    image = serializers.ImageField()
    is_main = serializers.BooleanField(required=False, default=False)
    sort_order = serializers.IntegerField(required=False, min_value=0, default=0)

    def validate_image(self, value):
        if value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image is larger than 15 MB.")
        content_type = (getattr(value, "content_type", "") or "").lower()
        if content_type and content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                "Only JPEG, PNG and WebP images are allowed."
            )
        value.seek(0)
        header = value.read(16)
        value.seek(0)
        if not _image_signature(header):
            raise serializers.ValidationError(
                "Only JPEG, PNG and WebP images are allowed."
            )
        return value

    def create(self, validated_data):
        variant = validated_data["product_variant"]
        is_main = validated_data["is_main"]
        with transaction.atomic():
            if is_main:
                ProductImage.objects.filter(
                    product_variant=variant,
                    is_main=True,
                ).update(is_main=False)
            image = ProductImage(
                product_variant=variant,
                is_main=is_main,
                sort_order=validated_data["sort_order"],
            )
            image.image.save(
                validated_data["image"].name,
                validated_data["image"],
                save=True,
            )
        return image


class AdminProductImageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("product_variant", "is_main", "sort_order")
        extra_kwargs = {
            "product_variant": {"required": False},
            "is_main": {"required": False},
            "sort_order": {"required": False, "min_value": 0},
        }

    def validate_product_variant(self, variant):
        if (
            self.instance
            and variant.product_id != self.instance.product_variant.product_id
        ):
            raise serializers.ValidationError(
                "The image can only be assigned to a variant of the same product."
            )
        return variant


def _image_signature(header: bytes) -> bool:
    if header.startswith(b"\xff\xd8\xff"):
        return True
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    return header.startswith(b"RIFF") and header[8:12] == b"WEBP"
