"""Rules that connect a variant to its category, size and color."""

CLOTHING = "clothing"
SHOES = "shoes"
ACCESSORIES = "accessories"
PERFUME = "perfume"

REQUIRES_COLOR = {CLOTHING, SHOES, ACCESSORIES}


def expected_size_type(product) -> str | None:
    """Which size family this product uses. Unknown catalogs return None."""
    category = product.subcategory.category.name.strip().lower()
    subcategory = product.subcategory.name.strip().lower()

    if category == "perfumes":
        return PERFUME
    if category == "shoes":
        return SHOES
    if category == "accessories" or subcategory == "accessories":
        return ACCESSORIES
    if category == "clothing" or subcategory == "clothing":
        return CLOTHING
    return None


def allowed_genders(product) -> set[str]:
    category = product.subcategory.category.name.strip().lower()
    subcategory = product.subcategory.name.strip().lower()

    if subcategory == "unisex":
        return {"unisex"}
    if subcategory == "men" or category == "men":
        return {"male", "unisex"}
    if subcategory == "women" or category == "women":
        return {"female", "unisex"}
    return {"male", "female", "unisex"}


def catalog_errors(*, product, size, color, gender) -> dict[str, str]:
    errors = {}
    expected = expected_size_type(product)

    if expected is None:
        if size is None:
            errors["size"] = "Size is required."
        if color is None:
            errors["color"] = "Color is required."
    else:
        if size is None:
            errors["size"] = "Size is required."
        elif size.size_type != expected:
            errors["size"] = (
                f"This product needs a {expected} size, "
                f"not {size.size_type}."
            )
        if expected in REQUIRES_COLOR and color is None:
            errors["color"] = "Color is required for this product."

    allowed = allowed_genders(product)
    if gender not in allowed:
        errors["gender"] = (
            "This gender does not match the category. "
            f"Allowed: {', '.join(sorted(allowed))}."
        )
    return errors
