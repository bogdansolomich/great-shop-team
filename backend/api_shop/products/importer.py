"""Load the Wearly catalog from the prepared Excel workbook."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

import requests
from brands.models import Brand
from categories.models import Category, Subcategory
from colors.models import Color
from currencies.models import Currency
from django.core.files.base import ContentFile
from django.db import IntegrityError, transaction
from openpyxl import load_workbook
from product_images.models import ProductImage
from product_variants.models import Gender, ProductVariant
from sizes.models import Size

from colors.palette import ensure_required_colors

from .catalog_color_fixes import apply_catalog_color_fixes
from .models import Product

SHEET_HEADERS = {
    "Products": [
        "product_code",
        "name_ua",
        "name_en",
        "description_ua",
        "description_en",
        "brand",
        "subcategory_slug",
        "slug",
        "is_active",
        "is_hidden",
    ],
    "Variants": [
        "product_code",
        "sku",
        "size",
        "color",
        "gender",
        "stock",
        "is_active",
    ],
    "Prices": ["sku", "currency_code", "amount"],
    "Images": ["sku", "image", "is_main", "sort_order"],
    "Categories": [
        "category_name",
        "category_slug",
        "subcategory_name",
        "subcategory_slug",
        "is_active",
        "is_hidden",
    ],
    "Brands": ["name", "slug", "is_active", "is_hidden"],
    "Sizes": ["name", "size_type", "sort_order"],
    "Colors": ["name", "hex_code", "is_active"],
    "Currencies": ["code", "name", "is_active"],
}

SIZE_TYPES = {
    "clothing": "clothing",
    "shoes": "shoes",
    "perfume": "perfume",
    "perfumes": "perfume",
    "accessory": "accessories",
    "accessories": "accessories",
}
EMPTY_COLORS = {"", "n/a", "na", "none", "-", "null"}
CURRENCY_RE = re.compile(r"^[A-Z]{3}$")
HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
MAX_IMAGE_BYTES = 15 * 1024 * 1024


class ImportAbort(Exception):
    """Stop the write and roll the database transaction back."""


@dataclass
class RowIssue:
    sheet: str
    row: int
    message: str

    def __str__(self) -> str:
        return f"{self.sheet} row {self.row}: {self.message}"


@dataclass
class ImportReport:
    dry_run: bool = False
    errors: list[RowIssue] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    created: Counter = field(default_factory=Counter)
    updated: Counter = field(default_factory=Counter)
    images_created: int = 0
    images_updated: int = 0
    images_failed: int = 0

    @property
    def ok(self) -> bool:
        return not self.errors and self.images_failed == 0


def cell_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def parse_bool(value) -> bool | None:
    if isinstance(value, bool):
        return value
    text = cell_text(value).upper()
    if text in {"TRUE", "1", "YES"}:
        return True
    if text in {"FALSE", "0", "NO"}:
        return False
    return None


def parse_int(value) -> int | None:
    if isinstance(value, bool) or value is None or cell_text(value) == "":
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    try:
        return int(cell_text(value))
    except ValueError:
        return None


def parse_amount(value) -> Decimal | None:
    if value is None or cell_text(value) == "":
        return None
    if isinstance(value, float):
        text = format(value, ".2f")
    elif isinstance(value, Decimal):
        text = str(value)
    else:
        text = cell_text(value).replace(",", ".")
    try:
        return Decimal(text).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def empty_color(value) -> bool:
    return cell_text(value).lower() in EMPTY_COLORS


def import_catalog(path: str | Path, *, dry_run: bool = False) -> ImportReport:
    report = ImportReport(dry_run=dry_run)
    workbook_path = Path(path)
    if not workbook_path.is_file():
        report.errors.append(RowIssue("Workbook", 0, f"File not found: {workbook_path}"))
        return report

    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    try:
        tables = _read_tables(workbook, report)
    finally:
        workbook.close()

    if report.errors:
        return report

    _validate(tables, report, workbook_path.parent)
    if report.errors:
        return report

    try:
        with transaction.atomic():
            color_aliases = _write_references(tables, report)
            ensure_required_colors()
            _write_products(tables, report)
            _write_variants(tables, report, color_aliases)
            apply_catalog_color_fixes()
            _write_prices(tables, report)
            if dry_run:
                transaction.set_rollback(True)
    except ImportAbort:
        return report
    except IntegrityError as exc:
        report.errors.append(RowIssue("Database", 0, str(exc)))
        return report

    if dry_run:
        report.images_created = _count_new_images(tables)
        return report

    _import_images(tables, workbook_path.parent, report)
    return report


def _read_tables(workbook, report: ImportReport) -> dict[str, list[dict]]:
    tables = {}
    for sheet_name, expected in SHEET_HEADERS.items():
        if sheet_name not in workbook.sheetnames:
            report.errors.append(RowIssue(sheet_name, 1, "Sheet is missing."))
            tables[sheet_name] = []
            continue

        worksheet = workbook[sheet_name]
        rows = worksheet.iter_rows(values_only=True)
        header_row = next(rows, None)
        if header_row is None:
            report.errors.append(RowIssue(sheet_name, 1, "Header row is missing."))
            tables[sheet_name] = []
            continue

        headers = [cell_text(cell) for cell in header_row]
        missing = [name for name in expected if name not in headers]
        if missing:
            report.errors.append(
                RowIssue(sheet_name, 1, "Missing columns: " + ", ".join(missing))
            )
            tables[sheet_name] = []
            continue

        extra = [name for name in headers if name and name not in expected]
        if extra:
            report.warnings.append(
                f"{sheet_name}: extra columns ignored: {', '.join(extra)}"
            )

        parsed = []
        for offset, values in enumerate(rows, start=2):
            if values is None or all(cell is None or cell_text(cell) == "" for cell in values):
                continue
            item = {"_row": offset}
            for name in expected:
                index = headers.index(name)
                item[name] = values[index] if index < len(values) else None
            parsed.append(item)
        tables[sheet_name] = parsed
    return tables


def _validate(tables: dict[str, list[dict]], report: ImportReport, root: Path) -> None:
    categories = {}
    subcategories = {}
    brands = {brand.name.casefold(): brand for brand in Brand.objects.all()}
    sizes = {size.name.casefold(): size for size in Size.objects.all()}
    colors = {color.name.casefold(): color for color in Color.objects.all()}
    known_codes = set(
        Product.objects.exclude(product_code__isnull=True).values_list(
            "product_code", flat=True
        )
    )
    known_skus = set(ProductVariant.objects.values_list("sku", flat=True))
    currency_codes = set()

    seen_categories = {}
    for item in tables["Categories"]:
        row = item["_row"]
        name = cell_text(item["category_name"])
        slug = cell_text(item["category_slug"])
        sub_name = cell_text(item["subcategory_name"])
        sub_slug = cell_text(item["subcategory_slug"])
        if not name or not slug or not sub_name or not sub_slug:
            report.errors.append(
                RowIssue("Categories", row, "Category and subcategory need a name and a slug.")
            )
            continue
        previous = seen_categories.get(slug)
        if previous and previous != name:
            report.errors.append(
                RowIssue("Categories", row, f"Slug {slug} is used by another category.")
            )
        seen_categories[slug] = name
        categories[slug] = name
        if sub_slug in subcategories and subcategories[sub_slug]["name"] != sub_name:
            report.errors.append(
                RowIssue("Categories", row, f"Slug {sub_slug} is used by another subcategory.")
            )
        subcategories[sub_slug] = {"name": sub_name, "category": slug}

    seen_names = defaultdict(set)
    for slug, data in subcategories.items():
        key = (data["category"], data["name"].casefold())
        seen_names[key].add(slug)
    for (category_slug, name), slugs in seen_names.items():
        if len(slugs) > 1:
            report.errors.append(
                RowIssue(
                    "Categories",
                    0,
                    f"Subcategory {name} is repeated inside {category_slug}.",
                )
            )

    for item in tables["Brands"]:
        row = item["_row"]
        name = cell_text(item["name"])
        slug = cell_text(item["slug"])
        if not name or not slug:
            report.errors.append(RowIssue("Brands", row, "Brand needs a name and a slug."))
            continue
        brands[name.casefold()] = name

    for item in tables["Sizes"]:
        row = item["_row"]
        name = cell_text(item["name"])
        raw_type = cell_text(item["size_type"]).lower()
        if not name:
            report.errors.append(RowIssue("Sizes", row, "Size name is empty."))
            continue
        if raw_type not in SIZE_TYPES:
            report.errors.append(
                RowIssue("Sizes", row, f"Unknown size type: {raw_type or 'empty'}.")
            )
            continue
        if raw_type == "accessory":
            report.warnings.append(
                f"Sizes row {row}: type accessory is stored as accessories."
            )
        sizes[name.casefold()] = name

    for item in tables["Colors"]:
        row = item["_row"]
        name = cell_text(item["name"])
        hex_code = cell_text(item["hex_code"]).upper()
        if empty_color(name):
            report.warnings.append(
                f"Colors row {row}: {name or 'empty'} is not a color and will be skipped."
            )
            continue
        if not HEX_RE.match(hex_code):
            report.errors.append(RowIssue("Colors", row, "hex_code must look like #000000."))
            continue
        colors[name.casefold()] = name

    for item in tables["Currencies"]:
        row = item["_row"]
        code = cell_text(item["code"]).upper()
        if not CURRENCY_RE.match(code):
            report.errors.append(
                RowIssue("Currencies", row, "Currency code must be 3 letters.")
            )
            continue
        currency_codes.add(code)

    product_codes = set(known_codes)
    names_en = defaultdict(list)
    seen_product_codes = set()
    seen_slugs = set()
    for item in tables["Products"]:
        row = item["_row"]
        code = cell_text(item["product_code"])
        name_uk = cell_text(item["name_ua"])
        name_en = cell_text(item["name_en"])
        brand = cell_text(item["brand"])
        subcategory_slug = cell_text(item["subcategory_slug"])
        slug = cell_text(item["slug"])
        if not code:
            report.errors.append(RowIssue("Products", row, "product_code is empty."))
            continue
        if code in seen_product_codes:
            report.errors.append(RowIssue("Products", row, f"Duplicate product_code {code}."))
        seen_product_codes.add(code)
        product_codes.add(code)
        if not name_uk and not name_en:
            report.errors.append(RowIssue("Products", row, "The product needs a name."))
        if len(cell_text(item["description_ua"])) > 500 or len(cell_text(item["description_en"])) > 500:
            report.errors.append(RowIssue("Products", row, "Description is longer than 500 characters."))
        if brand.casefold() not in brands:
            report.errors.append(RowIssue("Products", row, f"Unknown brand {brand}."))
        if subcategory_slug not in subcategories and not Subcategory.objects.filter(slug=subcategory_slug).exists():
            report.errors.append(
                RowIssue("Products", row, f"Unknown subcategory_slug {subcategory_slug}.")
            )
        if not slug:
            report.errors.append(RowIssue("Products", row, "slug is empty."))
        elif slug in seen_slugs or Product.objects.filter(slug=slug).exclude(product_code=code).exists():
            report.errors.append(
                RowIssue("Products", row, f"Slug {slug} already belongs to another product.")
            )
        seen_slugs.add(slug)
        if parse_bool(item["is_active"]) is None or parse_bool(item["is_hidden"]) is None:
            report.errors.append(RowIssue("Products", row, "is_active and is_hidden must be TRUE or FALSE."))
        if name_en:
            names_en[name_en.casefold()].append(row)

    for rows in names_en.values():
        if len(rows) > 1:
            report.warnings.append(
                "Products: the same English name is used on rows " + ", ".join(map(str, rows)) + "."
            )

    skus = set(known_skus)
    seen_skus = set()
    for item in tables["Variants"]:
        row = item["_row"]
        code = cell_text(item["product_code"])
        sku = cell_text(item["sku"])
        size_name = cell_text(item["size"])
        color_name = cell_text(item["color"])
        gender = cell_text(item["gender"]).lower()
        stock = parse_int(item["stock"])
        if not sku:
            report.errors.append(RowIssue("Variants", row, "sku is empty."))
            continue
        if sku in seen_skus:
            report.errors.append(RowIssue("Variants", row, f"Duplicate sku {sku}."))
        seen_skus.add(sku)
        skus.add(sku)
        if code not in product_codes:
            report.errors.append(RowIssue("Variants", row, f"Unknown product_code {code}."))
        if not size_name or size_name.casefold() not in sizes:
            report.errors.append(RowIssue("Variants", row, f"Unknown size {size_name or 'empty'}."))
        if not empty_color(color_name) and color_name.casefold() not in colors:
            report.errors.append(RowIssue("Variants", row, f"Unknown color {color_name}."))
        if gender not in set(Gender.values):
            report.errors.append(RowIssue("Variants", row, f"Unknown gender {gender or 'empty'}."))
        if stock is None or stock < 0:
            report.errors.append(RowIssue("Variants", row, "stock must be a whole number, zero or more."))
        if parse_bool(item["is_active"]) is None:
            report.errors.append(RowIssue("Variants", row, "is_active must be TRUE or FALSE."))

    seen_prices = set()
    priced_skus = set()
    for item in tables["Prices"]:
        row = item["_row"]
        sku = cell_text(item["sku"])
        code = cell_text(item["currency_code"]).upper()
        amount = parse_amount(item["amount"])
        if sku not in skus:
            report.errors.append(RowIssue("Prices", row, f"Unknown sku {sku}."))
        if code not in currency_codes:
            report.errors.append(RowIssue("Prices", row, f"Unknown currency {code or 'empty'}."))
        if amount is None or amount <= 0:
            report.errors.append(RowIssue("Prices", row, "amount must be greater than zero."))
        key = (sku, code)
        if key in seen_prices:
            report.errors.append(RowIssue("Prices", row, f"{sku} already has a {code} price."))
        seen_prices.add(key)
        priced_skus.add(sku)

    file_skus = {cell_text(item["sku"]) for item in tables["Variants"]}
    for sku in sorted(file_skus - priced_skus):
        report.warnings.append(f"Variants: {sku} has no price.")

    mains = defaultdict(list)
    image_skus = set()
    for item in tables["Images"]:
        row = item["_row"]
        sku = cell_text(item["sku"])
        image = cell_text(item["image"])
        is_main = parse_bool(item["is_main"])
        sort_order = parse_int(item["sort_order"])
        if sku not in skus:
            report.errors.append(RowIssue("Images", row, f"Unknown sku {sku}."))
            continue
        image_skus.add(sku)
        if not image:
            report.errors.append(RowIssue("Images", row, "image is empty."))
        elif len(image) > 2000:
            report.errors.append(RowIssue("Images", row, "image value is longer than 2000 characters."))
        elif image.lower().startswith(("http://", "https://")):
            pass
        elif not _local_image(image, root).is_file():
            report.errors.append(RowIssue("Images", row, f"Photo not found: {image}"))
        if is_main is None:
            report.errors.append(RowIssue("Images", row, "is_main must be TRUE or FALSE."))
        elif is_main:
            mains[sku].append(row)
        if sort_order is None or sort_order < 0:
            report.errors.append(RowIssue("Images", row, "sort_order must be a whole number, zero or more."))

    for sku, rows in mains.items():
        if len(rows) > 1:
            report.errors.append(
                RowIssue("Images", rows[1], f"{sku} has more than one main image.")
            )

    for item in tables["Images"]:
        sku = cell_text(item["sku"])
        if sku and sku not in mains and sku in image_skus:
            report.warnings.append(
                f"Images row {item['_row']}: {sku} has photos but none is marked as the main image."
            )
            mains[sku] = [-1]

    for sku in sorted(file_skus - image_skus):
        report.warnings.append(f"Variants: {sku} has no photo.")


def _flag(item, field: str) -> bool:
    parsed = parse_bool(item[field])
    return bool(parsed)


def _write_references(tables, report: ImportReport) -> dict[str, Color]:
    categories = {}
    for item in tables["Categories"]:
        slug = cell_text(item["category_slug"])
        name = cell_text(item["category_name"])
        if slug in categories:
            continue
        category, created = Category.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "name_en": name,
                "is_active": _flag(item, "is_active"),
                "is_hidden": _flag(item, "is_hidden"),
            },
        )
        categories[slug] = category
        report.created["categories"] += int(created)
        report.updated["categories"] += int(not created)

    for item in tables["Categories"]:
        category = categories[cell_text(item["category_slug"])]
        name = cell_text(item["subcategory_name"])
        slug = cell_text(item["subcategory_slug"])
        subcategory = Subcategory.objects.filter(slug=slug).first()
        if subcategory is None:
            subcategory = Subcategory.objects.filter(category=category, name=name).first()
        created = subcategory is None
        if subcategory is None:
            subcategory = Subcategory(slug=slug, category=category, name=name)
        subcategory.category = category
        subcategory.name = name
        subcategory.name_en = name
        subcategory.slug = slug
        subcategory.is_active = _flag(item, "is_active")
        subcategory.is_hidden = _flag(item, "is_hidden")
        subcategory.save()
        report.created["subcategories"] += int(created)
        report.updated["subcategories"] += int(not created)

    for item in tables["Brands"]:
        _save_counted(
            Brand,
            {"name": cell_text(item["name"])},
            {
                "slug": cell_text(item["slug"]),
                "name_en": cell_text(item["name"]),
                "is_active": _flag(item, "is_active"),
                "is_hidden": _flag(item, "is_hidden"),
            },
            report,
            "brands",
        )

    for item in tables["Sizes"]:
        raw_type = cell_text(item["size_type"]).lower()
        _save_counted(
            Size,
            {"name": cell_text(item["name"])},
            {
                "size_type": SIZE_TYPES[raw_type],
                "sort_order": parse_int(item["sort_order"]) or 0,
            },
            report,
            "sizes",
        )

    color_aliases: dict[str, Color] = {}
    for item in tables["Colors"]:
        name = cell_text(item["name"])
        if empty_color(name):
            continue
        hex_code = cell_text(item["hex_code"]).upper()
        taken = Color.objects.filter(hex_code__iexact=hex_code).exclude(name=name).first()
        if taken:
            color_aliases[name.casefold()] = taken
            report.warnings.append(
                f"Colors: {name} uses the existing color {taken.name} ({taken.hex_code})."
            )
            continue
        color, created = Color.objects.update_or_create(
            name=name,
            defaults={"hex_code": hex_code, "is_active": _flag(item, "is_active")},
        )
        color_aliases[name.casefold()] = color
        report.created["colors"] += int(created)
        report.updated["colors"] += int(not created)
    return color_aliases


def _write_products(tables, report: ImportReport) -> None:
    brands = {brand.name.casefold(): brand for brand in Brand.objects.all()}
    subcategories = {item.slug: item for item in Subcategory.objects.all()}
    for item in tables["Products"]:
        code = cell_text(item["product_code"])
        name_uk = cell_text(item["name_ua"])
        name_en = cell_text(item["name_en"])
        slug = cell_text(item["slug"])
        defaults = {
            "name": name_uk or name_en,
            "name_uk": name_uk,
            "name_en": name_en,
            "description": cell_text(item["description_ua"]) or cell_text(item["description_en"]),
            "description_uk": cell_text(item["description_ua"]),
            "description_en": cell_text(item["description_en"]),
            "slug": slug,
            "brand": brands[cell_text(item["brand"]).casefold()],
            "subcategory": subcategories[cell_text(item["subcategory_slug"])],
            "is_active": _flag(item, "is_active"),
            "is_hidden": _flag(item, "is_hidden"),
        }
        _save_counted(Product, {"product_code": code}, defaults, report, "products")


def _color_for(name: str, aliases: dict[str, Color]) -> Color | None:
    if empty_color(name):
        return None
    alias = aliases.get(name.casefold())
    if alias is not None:
        return alias
    return Color.objects.filter(name__iexact=name).first()


def _write_variants(tables, report: ImportReport, color_aliases: dict[str, Color]) -> None:
    products = {
        product.product_code: product
        for product in Product.objects.select_related("subcategory", "subcategory__category")
        if product.product_code
    }
    sizes = {size.name.casefold(): size for size in Size.objects.all()}
    for item in tables["Variants"]:
        row = item["_row"]
        product = products[cell_text(item["product_code"])]
        size = sizes[cell_text(item["size"]).casefold()]
        color = _color_for(cell_text(item["color"]), color_aliases)
        sku = cell_text(item["sku"])
        variant = ProductVariant.objects.filter(sku=sku).first()
        created = variant is None
        if variant is None:
            variant = ProductVariant(sku=sku)
        variant.product = product
        variant.size = size
        variant.color = color
        variant.stock = parse_int(item["stock"]) or 0
        variant.gender = cell_text(item["gender"]).lower()
        variant.is_active = _flag(item, "is_active")
        try:
            variant.full_clean()
        except Exception as exc:
            report.errors.append(RowIssue("Variants", row, _clean_message(exc)))
            raise ImportAbort from exc
        variant.save()
        report.created["variants"] += int(created)
        report.updated["variants"] += int(not created)


def _write_prices(tables, report: ImportReport) -> None:
    variants = {variant.sku: variant for variant in ProductVariant.objects.all()}
    for item in tables["Prices"]:
        variant = variants[cell_text(item["sku"])]
        code = cell_text(item["currency_code"]).upper()
        _save_counted(
            Currency,
            {"product_variant": variant, "currency_code": code},
            {"amount": parse_amount(item["amount"])},
            report,
            "prices",
        )


def _save_counted(model, lookup: dict, defaults: dict, report: ImportReport, label: str) -> None:
    _obj, created = model.objects.update_or_create(defaults=defaults, **lookup)
    report.created[label] += int(created)
    report.updated[label] += int(not created)


def _count_new_images(tables) -> int:
    existing = {
        (image.product_variant.sku, image.source_url)
        for image in ProductImage.objects.select_related("product_variant")
        if image.source_url
    }
    return sum(
        1
        for item in tables["Images"]
        if (cell_text(item["sku"]), cell_text(item["image"])) not in existing
    )


def _local_image(source: str, root: Path) -> Path:
    path = Path(source)
    if not path.is_absolute():
        path = root / path
    return path


def _clean_message(exc: Exception) -> str:
    if hasattr(exc, "message_dict"):
        parts = []
        for key, messages in exc.message_dict.items():
            text = "; ".join(messages)
            parts.append(f"{key}: {text}")
        return " ".join(parts)
    return str(exc)


def _import_images(tables, root: Path, report: ImportReport) -> None:
    variants = {variant.sku: variant for variant in ProductVariant.objects.all()}
    for item in tables["Images"]:
        sku = cell_text(item["sku"])
        source = cell_text(item["image"])
        variant = variants.get(sku)
        if variant is None:
            report.images_failed += 1
            report.errors.append(
                RowIssue("Images", item["_row"], f"Variant {sku} was not saved.")
            )
            continue
        is_main = bool(parse_bool(item["is_main"]))
        sort_order = parse_int(item["sort_order"]) or 0
        existing = ProductImage.objects.filter(
            product_variant=variant, source_url=source
        ).first()
        if existing:
            if is_main:
                ProductImage.objects.filter(
                    product_variant=variant, is_main=True
                ).exclude(pk=existing.pk).update(is_main=False)
            existing.is_main = is_main
            existing.sort_order = sort_order
            existing.save(update_fields=["is_main", "sort_order", "updated_at"])
            report.images_updated += 1
            continue
        try:
            content, filename = _read_image(source, root)
            if is_main:
                ProductImage.objects.filter(
                    product_variant=variant, is_main=True
                ).update(is_main=False)
            image = ProductImage(
                product_variant=variant,
                source_url=source,
                is_main=is_main,
                sort_order=sort_order,
            )
            image.image.save(filename, ContentFile(content), save=True)
            report.images_created += 1
        except Exception as exc:
            report.images_failed += 1
            report.errors.append(RowIssue("Images", item["_row"], str(exc)))


def _read_image(source: str, root: Path) -> tuple[bytes, str]:
    if source.lower().startswith(("http://", "https://")):
        response = requests.get(source, timeout=20)
        response.raise_for_status()
        content = response.content
        filename = Path(urlparse(source).path).name or "image.jpg"
        content_type = response.headers.get("Content-Type", "")
    else:
        path = _local_image(source, root)
        if not path.is_file():
            raise FileNotFoundError(f"Photo not found: {path}")
        content = path.read_bytes()
        filename = path.name
        content_type = ""

    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image is larger than 15 MB.")
    if not _looks_like_image(content, content_type):
        raise ValueError("The file is not a supported image.")
    if "." not in filename:
        filename = f"{filename}.jpg"
    return content, filename


def _looks_like_image(content: bytes, content_type: str) -> bool:
    if content_type.lower().startswith("image/"):
        return True
    signatures = (
        b"\xff\xd8\xff",
        b"\x89PNG\r\n\x1a\n",
        b"GIF87a",
        b"GIF89a",
        b"RIFF",
    )
    return any(content.startswith(signature) for signature in signatures)


def format_report(report: ImportReport) -> str:
    lines = ["Dry run." if report.dry_run else "Import."]
    for label in (
        "categories",
        "subcategories",
        "brands",
        "sizes",
        "colors",
        "products",
        "variants",
        "prices",
    ):
        lines.append(
            f"{label}: {report.created[label]} new, {report.updated[label]} updated"
        )
    lines.append(
        "images: "
        f"{report.images_created} new, {report.images_updated} updated, "
        f"{report.images_failed} failed"
    )
    if report.warnings:
        lines.append("Warnings:")
        lines.extend(f"- {warning}" for warning in report.warnings)
    if report.errors:
        lines.append("Errors:")
        lines.extend(f"- {error}" for error in report.errors)
    return "\n".join(lines)
