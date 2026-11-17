#!/bin/sh

set -e

echo "--> Collect staticfiles..."
python api_shop/manage.py collectstatic --no-input

echo "--> Applying database migrations..."
python api_shop/manage.py migrate

# Free Render instances have no shell, so palette fixes run on boot.
# The command is idempotent: it only inserts Green if missing and only
# retags variants that still have the imported (wrong) color.
echo "--> Ensuring catalog colors..."
python api_shop/manage.py fix_catalog_colors

# Free Render instances have no shell. IMPORT_EXCEL=true loads the workbook
# once during boot. Remove the variable after a successful deploy, otherwise
# every restart replaces the catalog again.
case "$(printf '%s' "$IMPORT_EXCEL" | tr '[:upper:]' '[:lower:]')" in
  true|1|yes)
    echo "--> Replacing the catalog from Excel..."
    python api_shop/manage.py replace_catalog_from_excel \
      /app/Wearly_Shop_21_Products_Template.xlsx
    ;;
esac

python api_shop/manage.py create_default_superuser

echo "--> Starting Gunicorn..."

exec /opt/venv/bin/gunicorn --bind 0.0.0.0:"${PORT:-8000}" --workers 3 --access-logfile - --chdir /app/api_shop api_shop.wsgi:application
