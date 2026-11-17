import pytest
from django.contrib.auth import get_user_model
from discounts.models import Discount
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def catalog_admin(db):
    return User.objects.create_user(
        email="discount-admin@example.com",
        password="test-password",
        is_active=True,
        is_staff=True,
    )


def discount_payload(variant):
    return {
        "product_variant": variant.id,
        "discount_type": "percentage",
        "amount": "15.00",
        "start_at": "2026-01-01T00:00:00Z",
        "end_at": "2027-01-01T00:00:00Z",
        "is_active": True,
    }


@pytest.mark.django_db
def test_admin_can_create_discount(catalog_admin, make_variant):
    variant = make_variant()
    client = APIClient()
    client.force_authenticate(user=catalog_admin)

    response = client.post(
        "/api/discounts/",
        discount_payload(variant),
        format="json",
    )

    assert response.status_code == 201
    assert Discount.objects.filter(product_variant=variant, amount="15.00").exists()


@pytest.mark.django_db
def test_customer_cannot_create_discount(api_client, make_variant):
    variant = make_variant()

    response = api_client.post(
        "/api/discounts/",
        discount_payload(variant),
        format="json",
    )

    assert response.status_code == 403
    assert not Discount.objects.filter(product_variant=variant).exists()


@pytest.mark.django_db
def test_anonymous_cannot_create_discount(make_variant):
    variant = make_variant()

    response = APIClient().post(
        "/api/discounts/",
        discount_payload(variant),
        format="json",
    )

    assert response.status_code == 401
    assert not Discount.objects.filter(product_variant=variant).exists()
