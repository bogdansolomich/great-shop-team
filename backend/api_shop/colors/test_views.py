import pytest
from colors.models import Color
from django.test import Client


@pytest.mark.django_db
def test_color_list_adds_green_when_missing():
    Color.objects.create(name="Black", hex_code="#000000")
    assert not Color.objects.filter(name="Green").exists()

    response = Client().get("/api/colors/")

    assert response.status_code == 200
    payload = response.json()
    rows = payload["results"] if isinstance(payload, dict) and "results" in payload else payload
    names = {row["name"] for row in rows}
    assert "Green" in names
    assert Color.objects.filter(name="Green", hex_code="#008000").exists()
