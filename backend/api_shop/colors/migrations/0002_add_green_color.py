"""Add Green to the color palette used by the storefront and the admin.

The Excel catalog import only writes colors that appear in the workbook, then
drops colors with no variants. Green never made it into the live shop, so the
admin color dropdowns had no Green even though products have green photos.
"""

from django.db import migrations

GREEN = ("Green", "#008000")


def add_green(apps, schema_editor):
    Color = apps.get_model("colors", "Color")
    name, hex_code = GREEN
    if Color.objects.filter(name__iexact=name).exists():
        return
    if Color.objects.filter(hex_code__iexact=hex_code).exists():
        return
    # An empty database gets Green from colors.json on `load_reference_data`.
    # Inserting it here would clash with that fixture's primary key.
    if Color.objects.count() == 0:
        return
    Color.objects.create(name=name, hex_code=hex_code, is_active=True)


class Migration(migrations.Migration):
    dependencies = [
        ("colors", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_green, migrations.RunPython.noop),
    ]
