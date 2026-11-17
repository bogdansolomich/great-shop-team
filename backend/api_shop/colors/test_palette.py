import pytest
from colors.models import Color
from colors.palette import ensure_required_colors


@pytest.mark.django_db
def test_ensure_required_colors_adds_green():
    assert not Color.objects.filter(name="Green").exists()

    created = ensure_required_colors()

    assert created == 1
    green = Color.objects.get(name="Green")
    assert green.hex_code == "#008000"
    assert green.is_active is True


@pytest.mark.django_db
def test_ensure_required_colors_does_not_duplicate_green():
    Color.objects.create(name="Green", hex_code="#008000")

    assert ensure_required_colors() == 0
    assert Color.objects.filter(name="Green").count() == 1


@pytest.mark.django_db
def test_ensure_required_colors_reuses_the_existing_hex_code():
    Color.objects.create(name="Forest", hex_code="#008000")

    assert ensure_required_colors() == 0
    assert not Color.objects.filter(name="Green").exists()
