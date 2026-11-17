from decimal import Decimal
from pathlib import Path

import pytest
from brands.models import Brand
from categories.models import Category, Subcategory
from colors.models import Color
from currencies.models import Currency
from django.core.exceptions import ValidationError
from django.core.files.storage import storages
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import IntegrityError, transaction
from openpyxl import Workbook
from product_images.models import ProductImage
from product_variants.models import ProductVariant
from rest_framework.test import APIClient
from sizes.models import Size

from products.importer import import_catalog
from products.models import Product

MINI_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
)


@pytest.fixture
def local_storage(settings, tmp_path):
    settings.STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }
    settings.MEDIA_ROOT = tmp_path
    storages._storages = {}
    return tmp_path


def make_product(category_name, subcategory_name, size_name, size_type):
    brand = Brand.objects.create(name=f"Brand {category_name}", slug=f"brand-{category_name}".lower())
    category = Category.objects.create(name=category_name, slug=category_name.lower())
    subcategory = Subcategory.objects.create(
        category=category,
        name=subcategory_name,
        slug=f"{category_name}-{subcategory_name}".lower(),
    )
    size = Size.objects.create(name=size_name, size_type=size_type, sort_order=1)
    color = Color.objects.create(
        name=f"Black {category_name}",
        hex_code="#11111" + str(len(category_name))[-1],
    )
    product = Product.objects.create(
        product_code=f"CODE-{category_name}".upper(),
        name="Legacy name",
        name_uk="Українська назва",
        name_en="English name",
        slug=f"product-{category_name}".lower(),
        description="Legacy description",
        description_uk="Український опис",
        description_en="English description",
        brand=brand,
        subcategory=subcategory,
    )
    return product, size, color


def variant(product, size, color, gender, sku):
    return ProductVariant(
        product=product,
        size=size,
        color=color,
        sku=sku,
        stock=2,
        gender=gender,
    )


@pytest.mark.django_db
def test_product_api_returns_ukrainian_and_english():
    product, size, color = make_product("Men", "Clothing", "M", "clothing")
    saved = variant(product, size, color, "male", "SKU-LANG")
    saved.full_clean()
    saved.save()
    Currency.objects.create(product_variant=saved, currency_code="UAH", amount=Decimal("100.00"))
    Currency.objects.create(product_variant=saved, currency_code="USD", amount=Decimal("3.00"))

    client = APIClient()
    ukrainian = client.get(f"/api/products/{product.id}/?lang=uk").json()
    english = client.get(f"/api/products/{product.id}/?lang=en").json()
    original = client.get(f"/api/products/{product.id}/").json()

    assert ukrainian["name"] == "Українська назва"
    assert ukrainian["description"] == "Український опис"
    assert ukrainian["translation_missing"] is False
    assert english["name"] == "English name"
    assert english["description"] == "English description"
    assert original["name"] == "Legacy name"
    assert original["name_uk"] == "Українська назва"
    assert original["name_en"] == "English name"
    assert original["variants"][0]["sku"] == "SKU-LANG"
    assert original["variants"][0]["size"] == "M"
    assert original["variants"][0]["color"] == color.name
    assert len(original["variants"][0]["prices"]) == 2


@pytest.mark.django_db
def test_hidden_and_inactive_products_are_not_public():
    product, _size, _color = make_product("Women", "Clothing", "S", "clothing")
    client = APIClient()

    product.is_hidden = True
    product.save(update_fields=["is_hidden"])
    assert client.get(f"/api/products/{product.id}/").status_code == 404

    product.is_hidden = False
    product.is_active = False
    product.save(update_fields=["is_hidden", "is_active"])
    assert client.get(f"/api/products/{product.id}/").status_code == 404


@pytest.mark.django_db
def test_clothing_and_shoes_need_size_and_color():
    clothing, size, color = make_product("Men", "Clothing", "M", "clothing")
    shirt = variant(clothing, size, color, "male", "SHIRT")
    shirt.full_clean()

    shirt.color = None
    with pytest.raises(ValidationError):
        shirt.full_clean()

    shoes_product, shoe_size, shoe_color = make_product("Shoes", "Men", "42", "shoes")
    pair = variant(shoes_product, shoe_size, shoe_color, "male", "SHOES")
    pair.full_clean()
    pair.color = None
    with pytest.raises(ValidationError):
        pair.full_clean()


@pytest.mark.django_db
def test_perfume_can_have_volume_without_color_and_gender_must_match():
    product, size, _color = make_product("Perfumes", "Unisex", "50 ml", "perfume")
    bottle = variant(product, size, None, "unisex", "PERFUME")
    bottle.full_clean()

    bottle.gender = "male"
    with pytest.raises(ValidationError):
        bottle.full_clean()


@pytest.mark.django_db
def test_accessory_uses_one_size_and_requires_color():
    product, size, color = make_product("Accessories", "Bags", "One Size", "accessories")
    bag = variant(product, size, color, "unisex", "BAG")
    bag.full_clean()

    bag.color = None
    with pytest.raises(ValidationError):
        bag.full_clean()


@pytest.mark.django_db
def test_one_variant_can_have_several_currencies_but_not_the_same_one_twice():
    product, size, color = make_product("Men", "Clothing", "L", "clothing")
    saved = variant(product, size, color, "male", "PRICES")
    saved.save()
    Currency.objects.create(product_variant=saved, currency_code="UAH", amount=Decimal("10.00"))
    Currency.objects.create(product_variant=saved, currency_code="USD", amount=Decimal("1.00"))

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Currency.objects.create(
                product_variant=saved,
                currency_code="UAH",
                amount=Decimal("11.00"),
            )

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Currency.objects.create(
                product_variant=saved,
                currency_code="EUR",
                amount=Decimal("0.00"),
            )


@pytest.mark.django_db
def test_a_variant_can_have_several_photos_and_only_one_main(local_storage):
    product, size, color = make_product("Men", "Clothing", "XL", "clothing")
    saved = variant(product, size, color, "unisex", "PHOTOS")
    saved.save()
    ProductImage.objects.create(
        product_variant=saved,
        image="products/PHOTOS/one.png",
        is_main=True,
        sort_order=1,
    )
    ProductImage.objects.create(
        product_variant=saved,
        image="products/PHOTOS/two.png",
        is_main=False,
        sort_order=2,
    )

    assert ProductImage.objects.filter(product_variant=saved).count() == 2
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ProductImage.objects.create(
                product_variant=saved,
                image="products/PHOTOS/three.png",
                is_main=True,
                sort_order=3,
            )


def write_workbook(path: Path, *, image="photo.png", stock=4, amount="10.50"):
    workbook = Workbook()
    sheets = {
        "Products": [
            ["product_code", "name_ua", "name_en", "description_ua", "description_en", "brand", "subcategory_slug", "slug", "is_active", "is_hidden"],
            ["WR-1", "Футболка", "T-Shirt", "Опис", "Description", "Nike", "men-clothing", "t-shirt", "TRUE", "FALSE"],
        ],
        "Variants": [
            ["product_code", "sku", "size", "color", "gender", "stock", "is_active"],
            ["WR-1", "WR-1-M", "M", "Black", "male", stock, "TRUE"],
        ],
        "Prices": [
            ["sku", "currency_code", "amount"],
            ["WR-1-M", "UAH", amount],
            ["WR-1-M", "USD", "2.00"],
        ],
        "Images": [
            ["sku", "image", "is_main", "sort_order"],
            ["WR-1-M", image, "TRUE", 1],
        ],
        "Categories": [
            ["category_name", "category_slug", "subcategory_name", "subcategory_slug", "is_active", "is_hidden"],
            ["Men", "men", "Clothing", "men-clothing", "TRUE", "FALSE"],
            ["Women", "women", "Clothing", "women-clothing", "TRUE", "FALSE"],
        ],
        "Brands": [
            ["name", "slug", "is_active", "is_hidden"],
            ["Nike", "nike", "TRUE", "FALSE"],
        ],
        "Sizes": [
            ["name", "size_type", "sort_order"],
            ["M", "clothing", 1],
        ],
        "Colors": [
            ["name", "hex_code", "is_active"],
            ["Black", "#000000", "TRUE"],
        ],
        "Currencies": [
            ["code", "name", "is_active"],
            ["UAH", "Hryvnia", "TRUE"],
            ["USD", "Dollar", "TRUE"],
        ],
    }
    first = True
    for title, rows in sheets.items():
        worksheet = workbook.active if first else workbook.create_sheet(title)
        if first:
            worksheet.title = title
            first = False
        for row in rows:
            worksheet.append(row)
    workbook.save(path)


@pytest.mark.django_db
def test_replace_catalog_from_excel_drops_old_products(local_storage, tmp_path):
    brand = Brand.objects.create(name="Old brand", slug="old-brand")
    category = Category.objects.create(name="Old category", slug="old-category")
    subcategory = Subcategory.objects.create(
        category=category,
        name="Old subcategory",
        slug="old-subcategory",
    )
    Product.objects.create(
        name="Old product",
        slug="old-product",
        brand=brand,
        subcategory=subcategory,
        product_code="OLD-1",
    )
    photo = tmp_path / "photo.png"
    photo.write_bytes(MINI_PNG)
    workbook = tmp_path / "catalog.xlsx"
    write_workbook(workbook, image="photo.png")

    call_command("replace_catalog_from_excel", str(workbook))

    assert not Product.objects.filter(product_code="OLD-1").exists()
    assert Product.objects.filter(product_code="WR-1").exists()
    assert not Category.objects.filter(slug="old-category").exists()


@pytest.mark.django_db
def test_excel_import_creates_catalog_and_second_run_does_not_duplicate(local_storage, tmp_path):
    photo = tmp_path / "photo.png"
    photo.write_bytes(MINI_PNG)
    workbook = tmp_path / "catalog.xlsx"
    write_workbook(workbook, image="photo.png")

    first = import_catalog(workbook)
    assert first.ok
    assert Product.objects.count() == 1
    assert ProductVariant.objects.count() == 1
    assert Currency.objects.count() == 2
    assert ProductImage.objects.count() == 1
    product = Product.objects.get(product_code="WR-1")
    assert product.name_uk == "Футболка"
    assert product.name_en == "T-Shirt"
    assert product.name == "Футболка"
    assert Subcategory.objects.filter(category__name="Men", name="Clothing").exists()
    assert Subcategory.objects.filter(category__name="Women", name="Clothing").exists()

    second = import_catalog(workbook)
    assert second.ok
    assert Product.objects.count() == 1
    assert ProductVariant.objects.count() == 1
    assert Currency.objects.count() == 2
    assert ProductImage.objects.count() == 1
    assert second.created["products"] == 0
    assert second.updated["products"] == 1
    assert second.images_updated == 1


@pytest.mark.django_db
def test_dry_run_does_not_change_the_database_or_upload_photos(local_storage, tmp_path, monkeypatch):
    photo = tmp_path / "photo.png"
    photo.write_bytes(MINI_PNG)
    workbook = tmp_path / "catalog.xlsx"
    write_workbook(workbook, image="photo.png")

    def fail_download(*args, **kwargs):
        raise AssertionError("Dry run must not download photos.")

    monkeypatch.setattr("products.importer.requests.get", fail_download)
    report = import_catalog(workbook, dry_run=True)

    assert report.ok
    assert report.created["products"] == 1
    assert report.images_created == 1
    assert Product.objects.count() == 0
    assert ProductVariant.objects.count() == 0
    assert ProductImage.objects.count() == 0


@pytest.mark.django_db
def test_invalid_row_names_the_sheet_and_row(tmp_path):
    workbook = tmp_path / "catalog.xlsx"
    write_workbook(workbook, stock="many")
    report = import_catalog(workbook)

    assert Product.objects.count() == 0
    assert any(error.sheet == "Variants" and error.row == 2 for error in report.errors)


@pytest.mark.django_db
def test_missing_photo_is_reported_with_its_row_and_nothing_is_saved(tmp_path):
    workbook = tmp_path / "catalog.xlsx"
    write_workbook(workbook, image="missing.jpg")
    report = import_catalog(workbook)

    assert Product.objects.count() == 0
    assert any(
        error.sheet == "Images" and error.row == 2 and "missing.jpg" in error.message
        for error in report.errors
    )
    with pytest.raises(CommandError):
        call_command("import_products", str(workbook))
