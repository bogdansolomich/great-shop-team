import typing as t

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from users.models import CustomUser


class Command(BaseCommand):
    help = "Creates or updates the configured deployment superuser"

    def handle(self, *args: t.Any, **options: t.Any) -> None:
        email = (settings.SUPER_LOGIN or "").strip().lower()
        password = settings.SUPER_PASSWORD or ""

        if not email or not password:
            self.stderr.write(
                self.style.ERROR("SUPER_LOGIN and SUPER_PASSWORD must be configured")
            )
            return

        with transaction.atomic():
            user = CustomUser.objects.filter(email__iexact=email).first()
            if user is None:
                CustomUser.objects.create_superuser(email=email, password=password)
                self.stdout.write(self.style.SUCCESS("Configured superuser created"))
                return

            changed_fields = []
            if not user.is_active:
                user.is_active = True
                changed_fields.append("is_active")
            if not user.is_staff:
                user.is_staff = True
                changed_fields.append("is_staff")
            if not user.is_superuser:
                user.is_superuser = True
                changed_fields.append("is_superuser")
            if not user.check_password(password):
                user.set_password(password)
                changed_fields.append("password")

            if changed_fields:
                user.save(update_fields=changed_fields)
                self.stdout.write(self.style.SUCCESS("Configured superuser updated"))
            else:
                self.stdout.write(
                    self.style.SUCCESS("Configured superuser already up to date")
                )
