"""Make the color of catalog variants match the photos they are shown with.

The catalog imported from Wearly_Shop_21_Products_Template.xlsx has a few variants
whose color label disagrees with their photo: a green T-shirt filed as Gray, a gray
dress filed as Beige, a pink skirt filed as Gray, a brown hoodie filed as Beige.
The storefront filters by color, so those products turned up under the wrong color
and never under their real one. Two photos and one variant are wrong as well.

Every step only touches a row that still looks the way it was imported, so this
does nothing on a database where the data was already corrected by hand, and
nothing at all on an empty one (fresh install, tests).
"""

from django.db import migrations

# (SKU, color the variant was imported with, color its photo really shows)
RECOLORED_VARIANTS = [
    # Basic T-Shirt: the photo is green.
    ("WR-PRD-017-GRE-S", "Gray", "Green"),
    ("WR-PRD-017-GRE-M", "Gray", "Green"),
    ("WR-PRD-017-GRE-L", "Gray", "Green"),
    ("WR-PRD-017-GRE-XL", "Gray", "Green"),
    # Pleated Skirt: the photo is pink.
    ("WR-PRD-009-GRE-XS", "Gray", "Pink"),
    ("WR-PRD-009-GRE-S", "Gray", "Pink"),
    ("WR-PRD-009-GRE-M", "Gray", "Pink"),
    # Summer Midi Dress: the photo is gray.
    ("WR-PRD-007-BEI-XS", "Beige", "Gray"),
    ("WR-PRD-007-BEI-S", "Beige", "Gray"),
    ("WR-PRD-007-BEI-M", "Beige", "Gray"),
    ("WR-PRD-007-BEI-L", "Beige", "Gray"),
    # Oversize Hoodie: the photo is brown.
    ("WR-PRD-003-BEI-S", "Beige", "Brown"),
    ("WR-PRD-003-BEI-M", "Beige", "Brown"),
    ("WR-PRD-003-BEI-L", "Beige", "Brown"),
]

# Used only when the shop has no color with that name (or that hex code) yet.
COLOR_HEX_CODES = {
    "Gray": "#808080",
    "Brown": "#A52A2A",
    "Green": "#008000",
    "Pink": "#FFC0CB",
}

# The photo of this "brown" belt is the black belt, and there is no real photo to
# show instead, so the variant is taken off sale. Upload a brown photo and tick
# "Is active" in the admin to bring it back.
BROWN_BELT_SKU = "WR-PRD-006-BRO-ONESIZE"

# (SKU, part of the file name of a photo that shows another color than the variant)
WRONG_PHOTOS = [
    # Blue jeans, size L: the photo is the black pair.
    ("WR-PRD-002-BLU-L", "ajansmerter"),
    # Black sneakers, size 43: one of the photos is the white pair.
    ("WR-PRD-004-BLA-43", "air-max-270-white-white-black"),
]


def color_named(Color, name):
    """Return the shop's color called `name`, creating it when it does not exist.

    Hex codes are unique too, so a color that already owns the hex code is reused.
    """
    hex_code = COLOR_HEX_CODES[name]
    return (
        Color.objects.filter(name__iexact=name).first()
        or Color.objects.filter(hex_code__iexact=hex_code).first()
        or Color.objects.create(name=name, hex_code=hex_code)
    )


def fix_catalog_colors(apps, schema_editor):
    Color = apps.get_model("colors", "Color")
    ProductImage = apps.get_model("product_images", "ProductImage")
    ProductVariant = apps.get_model("product_variants", "ProductVariant")

    for sku, imported_as, really in RECOLORED_VARIANTS:
        variants = ProductVariant.objects.filter(
            sku=sku, color__name__iexact=imported_as
        )
        if variants.exists():
            variants.update(color=color_named(Color, really))

    ProductVariant.objects.filter(
        sku=BROWN_BELT_SKU, color__name__iexact="Brown", is_active=True
    ).update(is_active=False)

    for sku, file_name_part in WRONG_PHOTOS:
        ProductImage.objects.filter(
            product_variant__sku=sku, image__contains=file_name_part
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("colors", "0001_initial"),
        ("product_images", "0007_alter_productimage_image_max_length"),
        (
            "product_variants",
            "0005_alter_productvariant_color_alter_productvariant_size",
        ),
        (
            "products",
            "0004_product_description_en_product_description_uk_and_more",
        ),
    ]

    operations = [
        # Going back would put wrong labels and photos back, so it does nothing.
        migrations.RunPython(fix_catalog_colors, migrations.RunPython.noop),
    ]
