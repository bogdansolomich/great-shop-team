from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from products.importer import format_report, import_catalog


class Command(BaseCommand):
    help = "Import the catalog from the Wearly Excel workbook. Use --dry-run to check without saving."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="Path to the .xlsx workbook")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Check the workbook and print counts. Nothing is saved and photos are not uploaded.",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        report = import_catalog(path, dry_run=options["dry_run"])
        self.stdout.write(format_report(report))
        if not report.ok:
            raise CommandError("Import finished with errors.")
        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run complete. The database was not changed."))
        else:
            self.stdout.write(self.style.SUCCESS("Import complete."))
