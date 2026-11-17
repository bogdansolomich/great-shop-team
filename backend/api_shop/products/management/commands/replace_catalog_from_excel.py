from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from brands.models import Brand
from categories.models import Category, Subcategory
from colors.models import Color
from products.importer import format_report, import_catalog
from products.models import Product
from sizes.models import Size


class Command(BaseCommand):
    help = (
        "Delete the current products and load the Excel catalog. "
        "Orders keep their saved names and prices."
    )

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="Path to the .xlsx workbook")

    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.is_file():
            raise CommandError(f"File not found: {path}")

        deleted, _details = Product.objects.all().delete()
        self.stdout.write(f"Removed existing products ({deleted} rows).")

        report = import_catalog(path, dry_run=False)
        self.stdout.write(format_report(report))
        if report.errors:
            raise CommandError("Import finished with errors.")

        self.stdout.write(
            "brands "
            + str(Brand.objects.filter(products__isnull=True).delete())
        )
        self.stdout.write(
            "subcategories "
            + str(Subcategory.objects.filter(products__isnull=True).delete())
        )
        self.stdout.write(
            "categories "
            + str(Category.objects.filter(subcategories__isnull=True).delete())
        )
        # Keep unused colors (Green, …). The admin lists every Color row, and
        # dropping colors with no variants hid Green after each Excel import.
        self.stdout.write(f"colors kept {Color.objects.count()}")
        self.stdout.write(
            "sizes "
            + str(Size.objects.filter(product_variants__isnull=True).delete())
        )
        self.stdout.write(self.style.SUCCESS("Import complete."))
