from django.core.management.base import BaseCommand

from colors.palette import ensure_required_colors
from products.catalog_color_fixes import apply_catalog_color_fixes


class Command(BaseCommand):
    help = (
        "Add missing palette colors (Green) and relabel variants whose color "
        "does not match their photo."
    )

    def handle(self, *args, **options):
        added = ensure_required_colors()
        result = apply_catalog_color_fixes()
        self.stdout.write(f"Added {added} palette color(s).")
        self.stdout.write(
            self.style.SUCCESS(
                "Recolored {recolored} variant(s), deactivated {deactivated}, "
                "removed {removed_photos} photo(s).".format(**result)
            )
        )
