import pytest
from currencies.models import Currency
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def catalog_admin(db):
    return User.objects.create_user(
        email="catalog-admin@example.com",
        password="test-password",
        is_active=True,
        is_staff=True,
    )


@pytest.mark.django_db
def test_admin_can_create_currency(catalog_admin, make_variant):
    variant = make_variant(price=None)
    client = APIClient()
    client.force_authenticate(user=catalog_admin)

    response = client.post(
        "/api/currencies/",
        {
            "product_variant": variant.id,
            "currency_code": "UAH",
            "amount": "125.00",
        },
        format="json",
    )

    assert response.status_code == 201
    assert Currency.objects.filter(product_variant=variant, amount="125.00").exists()


@pytest.mark.django_db
def test_currency_amount_must_be_positive(catalog_admin, make_variant):
    variant = make_variant(price=None)
    client = APIClient()
    client.force_authenticate(user=catalog_admin)

    response = client.post(
        "/api/currencies/",
        {
            "product_variant": variant.id,
            "currency_code": "UAH",
            "amount": "0.00",
        },
        format="json",
    )

    assert response.status_code == 400
    assert not Currency.objects.filter(product_variant=variant).exists()


@pytest.mark.django_db
def test_customer_cannot_create_currency(api_client, make_variant):
    variant = make_variant(price=None)

    response = api_client.post(
        "/api/currencies/",
        {
            "product_variant": variant.id,
            "currency_code": "UAH",
            "amount": "125.00",
        },
        format="json",
    )

    assert response.status_code == 403
    assert not Currency.objects.filter(product_variant=variant).exists()


@pytest.mark.django_db
def test_anonymous_cannot_create_currency(make_variant):
    variant = make_variant(price=None)

    response = APIClient().post(
        "/api/currencies/",
        {
            "product_variant": variant.id,
            "currency_code": "UAH",
            "amount": "125.00",
        },
        format="json",
    )

    assert response.status_code == 401
    assert not Currency.objects.filter(product_variant=variant).exists()
