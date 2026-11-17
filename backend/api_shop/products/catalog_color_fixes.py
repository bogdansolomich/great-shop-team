"""Make the color of catalog variants match the photos they are shown with.

The Excel import labels a few variants with the wrong color: a green T-shirt
filed as Gray, a gray dress filed as Beige, a pink skirt filed as Gray, a brown
hoodie filed as Beige. The storefront filters by color, so those products turned
up under the wrong color and never under their real one.

Every step only touches a row that still looks the way it was imported, so this
does nothing on a database where the data was already corrected, and nothing at
all on an empty one.
"""

from colors.models import Color
from django.db.models import Q
from product_images.models import ProductImage
from product_variants.models import ProductVariant

# (SKU, color the variant was imported with, color its photo really shows)
RECOLORED_VARIANTS = [
    ("WR-PRD-017-GRE-S", "Gray", "Green"),
    ("WR-PRD-017-GRE-M", "Gray", "Green"),
    ("WR-PRD-017-GRE-L", "Gray", "Green"),
    ("WR-PRD-017-GRE-XL", "Gray", "Green"),
    ("WR-PRD-009-GRE-XS", "Gray", "Pink"),
    ("WR-PRD-009-GRE-S", "Gray", "Pink"),
    ("WR-PRD-009-GRE-M", "Gray", "Pink"),
    ("WR-PRD-007-BEI-XS", "Beige", "Gray"),
    ("WR-PRD-007-BEI-S", "Beige", "Gray"),
    ("WR-PRD-007-BEI-M", "Beige", "Gray"),
    ("WR-PRD-007-BEI-L", "Beige", "Gray"),
    ("WR-PRD-003-BEI-S", "Beige", "Brown"),
    ("WR-PRD-003-BEI-M", "Beige", "Brown"),
    ("WR-PRD-003-BEI-L", "Beige", "Brown"),
]

COLOR_HEX_CODES = {
    "Gray": "#808080",
    "Brown": "#A52A2A",
    "Green": "#008000",
    "Pink": "#FFC0CB",
}

BROWN_BELT_SKU = "WR-PRD-006-BRO-ONESIZE"

WRONG_PHOTOS = [
    ("WR-PRD-002-BLU-L", "ajansmerter"),
    ("WR-PRD-004-BLA-43", "air-max-270-white-white-black"),
]


def color_named(name: str) -> Color:
    hex_code = COLOR_HEX_CODES[name]
    return (
        Color.objects.filter(name__iexact=name).first()
        or Color.objects.filter(hex_code__iexact=hex_code).first()
        or Color.objects.create(name=name, hex_code=hex_code)
    )


def _color_name_q(name: str) -> Q:
    aliases = {"gray": ("Gray", "Grey"), "grey": ("Gray", "Grey")}
    names = aliases.get(name.lower(), (name,))
    query = Q()
    for alias in names:
        query |= Q(color__name__iexact=alias)
    return query


def apply_catalog_color_fixes() -> dict[str, int]:
    """Return how many variants were recolored, deactivated, and how many photos were removed."""
    recolored = 0
    for sku, imported_as, really in RECOLORED_VARIANTS:
        variants = ProductVariant.objects.filter(_color_name_q(imported_as), sku=sku)
        count = variants.count()
        if count:
            variants.update(color=color_named(really))
            recolored += count

    deactivated = ProductVariant.objects.filter(
        sku=BROWN_BELT_SKU, color__name__iexact="Brown", is_active=True
    ).update(is_active=False)

    removed_photos = 0
    for sku, file_name_part in WRONG_PHOTOS:
        deleted, _ = ProductImage.objects.filter(
            product_variant__sku=sku, image__contains=file_name_part
        ).delete()
        removed_photos += deleted

    return {
        "recolored": recolored,
        "deactivated": deactivated,
        "removed_photos": removed_photos,
    }
