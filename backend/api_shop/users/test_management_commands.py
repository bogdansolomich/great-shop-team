from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import override_settings

User = get_user_model()


@pytest.mark.django_db
@override_settings(
    SUPER_LOGIN="admin@example.com",
    SUPER_PASSWORD="StrongAdminPassword123!",
)
def test_create_default_superuser_creates_configured_user():
    call_command("create_default_superuser")

    user = User.objects.get(email="admin@example.com")
    assert user.is_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("StrongAdminPassword123!")


@pytest.mark.django_db
@override_settings(
    SUPER_LOGIN="admin@example.com",
    SUPER_PASSWORD="StrongAdminPassword123!",
)
def test_create_default_superuser_does_not_skip_when_another_superuser_exists():
    User.objects.create_superuser(
        email="existing-admin@example.com",
        password="ExistingAdminPassword123!",
    )

    call_command("create_default_superuser")

    assert User.objects.filter(email="admin@example.com", is_superuser=True).exists()
    assert User.objects.filter(is_superuser=True).count() == 2


@pytest.mark.django_db
@override_settings(
    SUPER_LOGIN="admin@example.com",
    SUPER_PASSWORD="StrongAdminPassword123!",
)
def test_create_default_superuser_promotes_and_resets_configured_user():
    User.objects.create_user(
        email="admin@example.com",
        password="OldPassword123!",
        is_active=False,
    )

    call_command("create_default_superuser")

    user = User.objects.get(email="admin@example.com")
    assert user.is_active is True
    assert user.is_staff is True
    assert user.is_superuser is True
    assert user.check_password("StrongAdminPassword123!")


@pytest.mark.django_db
@override_settings(SUPER_LOGIN="", SUPER_PASSWORD="")
def test_create_default_superuser_requires_credentials():
    stderr = StringIO()
    call_command("create_default_superuser", stderr=stderr)

    assert "SUPER_LOGIN and SUPER_PASSWORD must be configured" in stderr.getvalue()
