"""Colors the shop must always offer in admin, even when no product uses them yet."""

REQUIRED_COLORS = (("Green", "#008000"),)


def ensure_required_colors() -> int:
    """Create missing palette colors. Returns how many rows were added."""
    from colors.models import Color

    created = 0
    for name, hex_code in REQUIRED_COLORS:
        if Color.objects.filter(name__iexact=name).exists():
            continue
        if Color.objects.filter(hex_code__iexact=hex_code).exists():
            continue
        Color.objects.create(name=name, hex_code=hex_code, is_active=True)
        created += 1
    return created
