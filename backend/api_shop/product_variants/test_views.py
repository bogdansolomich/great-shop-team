import pytest
from django.contrib.auth import get_user_model
from product_variants.models import ProductVariant
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def catalog_admin(db):
    return User.objects.create_user(
        email="variant-admin@example.com",
        password="test-password",
        is_active=True,
        is_staff=True,
    )


def variant_payload(variant, *, sku="NEW-VARIANT"):
    return {
        "product": variant.product_id,
        "size": variant.size_id,
        "color": variant.color_id,
        "sku": sku,
        "stock": 5,
        "gender": "unisex",
        "is_active": True,
    }


@pytest.mark.django_db
def test_admin_can_create_product_variant(catalog_admin, make_variant):
    base_variant = make_variant()
    client = APIClient()
    client.force_authenticate(user=catalog_admin)

    response = client.post(
        "/api/product-variants/",
        variant_payload(base_variant),
        format="json",
    )

    assert response.status_code == 201
    assert ProductVariant.objects.filter(sku="NEW-VARIANT").exists()


@pytest.mark.django_db
def test_customer_cannot_create_product_variant(api_client, make_variant):
    variant = make_variant()

    response = api_client.post(
        "/api/product-variants/",
        variant_payload(variant),
        format="json",
    )

    assert response.status_code == 403
    assert not ProductVariant.objects.filter(sku="NEW-VARIANT").exists()


@pytest.mark.django_db
def test_anonymous_cannot_create_product_variant(make_variant):
    variant = make_variant()

    response = APIClient().post(
        "/api/product-variants/",
        variant_payload(variant),
        format="json",
    )

    assert response.status_code == 401
    assert not ProductVariant.objects.filter(sku="NEW-VARIANT").exists()


@pytest.mark.django_db
def test_admin_can_update_and_delete_product_variant(catalog_admin, make_variant):
    variant = make_variant()
    client = APIClient()
    client.force_authenticate(user=catalog_admin)

    update = client.patch(
        f"/api/product-variants/{variant.id}/",
        {"stock": 2},
        format="json",
    )
    assert update.status_code == 200
    variant.refresh_from_db()
    assert variant.stock == 2

    delete = client.delete(f"/api/product-variants/{variant.id}/")
    assert delete.status_code == 204
    assert not ProductVariant.objects.filter(id=variant.id).exists()
