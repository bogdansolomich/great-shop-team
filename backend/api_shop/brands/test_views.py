import pytest
from brands.models import Brand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_brand_list_remains_public():
    Brand.objects.create(name="Public Brand", slug="public-brand")

    response = APIClient().get("/api/brands/")

    assert response.status_code == 200
    assert response.data[0]["name"] == "Public Brand"


@pytest.mark.django_db
def test_admin_can_create_brand():
    admin = User.objects.create_user(
        email="admin-brand@example.com",
        password="test-password",
        is_active=True,
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.post(
        "/api/brands/",
        {
            "name": "New Brand",
            "slug": "new-brand",
            "is_active": True,
            "is_hidden": False,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "New Brand"
    assert Brand.objects.filter(name="New Brand", slug="new-brand").exists()


@pytest.mark.django_db
def test_customer_cannot_create_brand():
    customer = User.objects.create_user(
        email="customer-brand@example.com",
        password="test-password",
        is_active=True,
    )
    client = APIClient()
    client.force_authenticate(user=customer)

    response = client.post(
        "/api/brands/",
        {"name": "Forbidden Brand", "slug": "forbidden-brand"},
        format="json",
    )

    assert response.status_code == 403
    assert not Brand.objects.filter(name="Forbidden Brand").exists()


@pytest.mark.django_db
def test_anonymous_cannot_create_brand():
    response = APIClient().post(
        "/api/brands/",
        {"name": "Anonymous Brand", "slug": "anonymous-brand"},
        format="json",
    )

    assert response.status_code == 401
    assert not Brand.objects.filter(name="Anonymous Brand").exists()
