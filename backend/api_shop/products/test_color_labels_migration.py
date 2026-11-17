import importlib

import pytest
from brands.models import Brand
from categories.models import Category, Subcategory
from colors.models import Color
from django.apps import apps
from product_images.models import ProductImage
from product_variants.models import ProductVariant
from sizes.models import Size

from products.models import Product

migration = importlib.import_module("products.migrations.0005_fix_catalog_color_labels")

GRAY = ("Gray", "#808080")
BEIGE = ("Beige", "#F5F5DC")
BROWN = ("Brown", "#A52A2A")
BLACK = ("Black", "#000000")
BLUE = ("Blue", "#0000FF")
WHITE = ("White", "#FFFFFF")


def run_fix():
    migration.fix_catalog_colors(apps, None)


def color_of(sku):
    return ProductVariant.objects.get(sku=sku).color.name


@pytest.fixture
def add_variant(db):
    """Create a variant by SKU; the product is the one named by the SKU prefix."""
    brand = Brand.objects.create(name="Wearly", slug="wearly")
    category = Category.objects.create(name="Men", slug="men")
    subcategory = Subcategory.objects.create(
        category=category, name="Clothing", slug="men-clothing"
    )
    size = Size.objects.create(name="M", size_type="clothing", sort_order=1)

    def add(sku, color, **fields):
        code = sku.rsplit("-", 2)[0]
        product, _ = Product.objects.get_or_create(
            product_code=code,
            defaults={
                "name": code,
                "slug": code.lower(),
                "brand": brand,
                "subcategory": subcategory,
            },
        )
        name, hex_code = color
        color_row, _ = Color.objects.get_or_create(
            name=name, defaults={"hex_code": hex_code}
        )
        return ProductVariant.objects.create(
            product=product, size=size, color=color_row, sku=sku, **fields
        )

    return add


def add_photo(variant, file_name, **fields):
    return ProductImage.objects.create(
        product_variant=variant,
        image=f"media/products/{variant.sku}/{file_name}",
        **fields,
    )


def test_variants_get_the_color_their_photo_shows(add_variant):
    add_variant("WR-PRD-017-GRE-M", GRAY)
    add_variant("WR-PRD-017-BLA-M", BLACK)
    add_variant("WR-PRD-009-GRE-S", GRAY)
    add_variant("WR-PRD-007-BEI-L", BEIGE)
    add_variant("WR-PRD-003-BEI-S", BEIGE)

    run_fix()

    assert color_of("WR-PRD-017-GRE-M") == "Green"
    assert color_of("WR-PRD-009-GRE-S") == "Pink"
    assert color_of("WR-PRD-007-BEI-L") == "Gray"
    assert color_of("WR-PRD-003-BEI-S") == "Brown"
    assert color_of("WR-PRD-017-BLA-M") == "Black"
    assert Color.objects.get(name="Green").hex_code == "#008000"
    assert Color.objects.get(name="Pink").hex_code == "#FFC0CB"


def test_existing_colors_are_reused_not_duplicated(add_variant):
    add_variant("WR-PRD-007-BEI-M", BEIGE)
    add_variant("WR-PRD-003-BEI-M", BEIGE)
    add_variant("WR-PRD-001-GRE-M", GRAY)
    add_variant("WR-PRD-001-BRO-M", BROWN)

    run_fix()

    assert Color.objects.filter(name="Gray").count() == 1
    assert Color.objects.filter(name="Brown").count() == 1
    assert color_of("WR-PRD-007-BEI-M") == "Gray"
    assert color_of("WR-PRD-003-BEI-M") == "Brown"
    assert color_of("WR-PRD-001-GRE-M") == "Gray"


def test_a_color_that_already_owns_the_hex_code_is_used(add_variant):
    add_variant("WR-PRD-017-GRE-M", GRAY)
    Color.objects.create(name="Forest", hex_code="#008000")

    run_fix()

    assert color_of("WR-PRD-017-GRE-M") == "Forest"
    assert not Color.objects.filter(name="Green").exists()


def test_running_twice_or_after_a_manual_fix_changes_nothing_more(add_variant):
    add_variant("WR-PRD-017-GRE-M", GRAY)
    add_variant("WR-PRD-017-GRE-S", BLACK)

    run_fix()
    run_fix()

    assert color_of("WR-PRD-017-GRE-M") == "Green"
    assert color_of("WR-PRD-017-GRE-S") == "Black"
    assert Color.objects.filter(name="Green").count() == 1


def test_brown_belt_with_the_black_photo_is_taken_off_sale(add_variant):
    brown = add_variant("WR-PRD-006-BRO-ONESIZE", BROWN)
    black = add_variant("WR-PRD-006-BLA-ONESIZE", BLACK)

    run_fix()

    brown.refresh_from_db()
    black.refresh_from_db()
    assert brown.is_active is False
    assert black.is_active is True


def test_photos_of_another_color_are_removed(add_variant):
    blue_l = add_variant("WR-PRD-002-BLU-L", BLUE)
    blue_m = add_variant("WR-PRD-002-BLU-M", BLUE)
    add_photo(blue_l, "15-04-2023-ajansmerter-tgberk42948-6928_w4vhfb", is_main=True)
    add_photo(blue_m, "10572-6014_cly0fg", sort_order=2)

    black_43 = add_variant("WR-PRD-004-BLA-43", BLACK)
    white_43 = add_variant("WR-PRD-004-WHI-43", WHITE)
    add_photo(
        black_43,
        "krosivki-cholovichi-nike-air-max-270-white-white-black-1829201_zpy1gi",
        is_main=True,
    )
    add_photo(
        black_43,
        "krosivki-cholovichi-nike-air-max-270-black-anthracite-white-solar-red_xz",
        sort_order=2,
    )
    add_photo(
        white_43,
        "krosivki-cholovichi-nike-air-max-270-white-white-black-1829201_spcwqu",
        is_main=True,
    )

    run_fix()

    assert not ProductImage.objects.filter(product_variant=blue_l).exists()
    assert ProductImage.objects.filter(product_variant=blue_m).count() == 1
    remaining = ProductImage.objects.get(product_variant=black_43)
    assert "black-anthracite" in remaining.image.name
    assert ProductImage.objects.filter(product_variant=white_43).count() == 1


def test_an_empty_catalog_is_left_alone(db):
    run_fix()

    assert not Color.objects.exists()
    assert not ProductVariant.objects.exists()
