import pytest
from brands.models import Brand
from categories.models import Category, Subcategory
from colors.models import Color
from django.contrib.auth import get_user_model
from django.core.files.storage import storages
from django.core.files.uploadedfile import SimpleUploadedFile
from orders.models import Order, OrderItem
from product_images.models import ProductImage
from products.models import Product
from products.test_catalog import MINI_PNG, make_product, variant
from rest_framework.test import APIClient
from users.serializers import UserRegisterSerializer

User = get_user_model()


@pytest.fixture
def admin_client(db):
    admin = User.objects.create_user(
        email="admin@example.com",
        password="Test1234!",
        is_active=True,
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.fixture
def catalog():
    brand = Brand.objects.create(name="Admin Brand", slug="admin-brand")
    category = Category.objects.create(name="Women", slug="women")
    subcategory = Subcategory.objects.create(
        category=category,
        name="Dresses",
        slug="dresses",
    )
    return brand, category, subcategory


def _product_body(brand, subcategory, **extra):
    body = {
        "brand": brand.id,
        "subcategory": subcategory.id,
        "name": {"uk": "Чорна сукня", "en": "Black dress"},
        "description": {"uk": "Опис українською", "en": "English description"},
        "status": "ACTIVE",
    }
    body.update(extra)
    return body


@pytest.mark.django_db
def test_customer_cannot_open_admin_products(api_client):
    response = api_client.get("/api/admin/products/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_anonymous_admin_request_is_unauthorized():
    response = APIClient().get("/api/admin/products/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_admin_creates_one_product_in_both_languages(admin_client, catalog):
    brand, _category, subcategory = catalog

    created = admin_client.post(
        "/api/admin/products/",
        _product_body(brand, subcategory),
        format="json",
    )

    assert created.status_code == 201
    assert created.data["name"] == {"uk": "Чорна сукня", "en": "Black dress"}
    assert created.data["status"] == "ACTIVE"
    assert Product.objects.count() == 1

    edited = admin_client.patch(
        f"/api/admin/products/{created.data['id']}/",
        {"name": {"en": "Black evening dress"}},
        format="json",
    )

    assert edited.status_code == 200
    assert Product.objects.count() == 1
    assert edited.data["name"]["uk"] == "Чорна сукня"
    assert edited.data["name"]["en"] == "Black evening dress"

    public = APIClient().get("/api/products/?lang=en")
    assert public.status_code == 200
    assert public.data[0]["name"] == "Black evening dress"


@pytest.mark.django_db
def test_active_product_requires_both_translations(admin_client, catalog):
    brand, _category, subcategory = catalog

    response = admin_client.post(
        "/api/admin/products/",
        _product_body(
            brand,
            subcategory,
            name={"uk": "Чернетка", "en": ""},
            description={"uk": "", "en": ""},
            status="ACTIVE",
        ),
        format="json",
    )

    assert response.status_code == 400
    assert response.data["code"] == "translations_required"
    assert "name.en" in response.data["details"]
    assert Product.objects.count() == 0


@pytest.mark.django_db
def test_draft_can_omit_english_and_stays_out_of_the_catalog(admin_client, catalog):
    brand, _category, subcategory = catalog

    response = admin_client.post(
        "/api/admin/products/",
        _product_body(
            brand,
            subcategory,
            name={"uk": "Чернетка", "en": ""},
            description={"uk": "", "en": ""},
            status="DRAFT",
        ),
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == "DRAFT"
    assert "name.en" in response.data["missing_translations"]

    public = APIClient().get("/api/products/?lang=uk")
    assert public.data == []


@pytest.mark.django_db
def test_admin_hides_a_product_from_the_public_catalog(admin_client, catalog):
    brand, _category, subcategory = catalog
    created = admin_client.post(
        "/api/admin/products/",
        _product_body(brand, subcategory),
        format="json",
    )

    deleted = admin_client.delete(f"/api/admin/products/{created.data['id']}/")

    assert deleted.status_code == 204
    assert APIClient().get("/api/products/?lang=uk").data == []
    admin_list = admin_client.get("/api/admin/products/")
    assert admin_list.status_code == 200
    assert admin_list.data == []
    hidden = Product.objects.get(pk=created.data["id"])
    assert hidden.is_active is False
    assert hidden.is_hidden is True


@pytest.mark.django_db
def test_category_requires_both_languages(admin_client):
    response = admin_client.post(
        "/api/admin/categories/",
        {"name": {"uk": "Жінки", "en": ""}, "status": "ACTIVE"},
        format="json",
    )

    assert response.status_code == 400
    assert response.data["code"] == "translations_required"

    created = admin_client.post(
        "/api/admin/categories/",
        {"name": {"uk": "Жінки", "en": "Women"}, "status": "ACTIVE"},
        format="json",
    )

    assert created.status_code == 201
    assert created.data["name"] == {"uk": "Жінки", "en": "Women"}
    public = APIClient().get(f"/api/categories/{created.data['id']}/")
    assert public.status_code == 200


@pytest.mark.django_db
def test_inactive_category_is_hidden_from_the_public_catalog(admin_client):
    created = admin_client.post(
        "/api/admin/categories/",
        {"name": {"uk": "Архів", "en": "Archive"}, "status": "DRAFT"},
        format="json",
    )

    assert created.status_code == 201
    public = APIClient().get(f"/api/categories/{created.data['id']}/")
    assert public.status_code == 404


@pytest.mark.django_db
def test_order_status_change_keeps_the_purchased_name(admin_client, user):
    product, size, color = make_product("Men", "Shirts", "M", "clothing")
    saved = variant(product, size, color, "male", "SKU-KEEP")
    saved.full_clean()
    saved.save()
    order = Order.objects.create(
        user=user,
        status="PENDING",
        currency_code="UAH",
        total_amount="10.00",
        first_name="Ivan",
        last_name="Petrenko",
        phone="+380501234567",
        email=user.email,
        shipping_address="Kyiv",
    )
    item = OrderItem.objects.create(
        order=order,
        product_variant=saved,
        product_name="Name at purchase",
        sku=saved.sku,
        size="M",
        color="Black",
        unit_price="10.00",
        quantity=1,
        line_total="10.00",
    )

    response = admin_client.patch(
        f"/api/admin/orders/{order.id}/status/",
        {"status": "SHIPPED"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == "SHIPPED"
    item.refresh_from_db()
    assert item.product_name == "Name at purchase"

    product.name_en = "Changed after purchase"
    product.save(update_fields=["name_en", "updated_at"])
    item.refresh_from_db()
    assert item.product_name == "Name at purchase"

    customer = APIClient()
    customer.force_authenticate(user=user)
    forbidden = customer.patch(
        f"/api/admin/orders/{order.id}/status/",
        {"status": "CANCELLED"},
        format="json",
    )
    assert forbidden.status_code == 403


@pytest.mark.django_db
def test_account_reports_the_role(admin_client, api_client):
    admin = admin_client.get("/api/account/me/")
    customer = api_client.get("/api/account/me/")

    assert admin.status_code == 200
    assert admin.data["role"] == "ADMIN"
    assert customer.data["role"] == "CUSTOMER"
    assert "password" not in customer.data


@pytest.mark.django_db
def test_registration_fields_do_not_include_a_role():
    assert "is_staff" not in UserRegisterSerializer.Meta.fields
    assert "is_superuser" not in UserRegisterSerializer.Meta.fields


@pytest.mark.django_db
def test_admin_uploads_a_jpeg_png_or_webp_photo(admin_client, settings, tmp_path):
    settings.STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }
    settings.MEDIA_ROOT = tmp_path
    storages._storages = {}
    product, size, color = make_product("Shoes", "Boots", "36", "shoes")
    saved = variant(product, size, color, "female", "SHOE-1")
    saved.full_clean()
    saved.save()
    upload = SimpleUploadedFile("boot.png", MINI_PNG, content_type="image/png")

    response = admin_client.post(
        "/api/admin/product-images/",
        {"product_variant": saved.id, "image": upload, "is_main": True},
        format="multipart",
    )

    assert response.status_code == 201
    assert response.data["is_main"] is True
    assert response.data["image"]

    rejected = admin_client.post(
        "/api/admin/product-images/",
        {
            "product_variant": saved.id,
            "image": SimpleUploadedFile(
                "notes.txt",
                b"not an image",
                content_type="text/plain",
            ),
        },
        format="multipart",
    )
    assert rejected.status_code == 400


@pytest.mark.django_db
def test_admin_can_reassign_photo_to_another_variant_of_same_product(
    admin_client,
    settings,
    tmp_path,
):
    settings.STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }
    settings.MEDIA_ROOT = tmp_path
    storages._storages = {}
    product, size, black = make_product("Men", "Clothing", "M", "clothing")
    red = Color.objects.create(name="Red Men", hex_code="#ff0000")
    red_variant = variant(product, size, red, "male", "MEN-RED")
    black_variant = variant(product, size, black, "male", "MEN-BLACK")
    red_variant.full_clean()
    red_variant.save()
    black_variant.full_clean()
    black_variant.save()

    def upload(variant_id, filename):
        return admin_client.post(
            "/api/admin/product-images/",
            {
                "product_variant": variant_id,
                "image": SimpleUploadedFile(
                    filename,
                    MINI_PNG,
                    content_type="image/png",
                ),
                "is_main": True,
            },
            format="multipart",
        )

    red_image = upload(red_variant.id, "red.png")
    black_image = upload(black_variant.id, "black.png")
    assert red_image.status_code == 201
    assert black_image.status_code == 201

    reassigned = admin_client.patch(
        f"/api/admin/product-images/{red_image.data['id']}/",
        {
            "product_variant": black_variant.id,
            "is_main": True,
        },
        format="json",
    )

    assert reassigned.status_code == 200
    assert reassigned.data["product_variant"] == black_variant.id
    assert reassigned.data["is_main"] is True
    assert not ProductImage.objects.get(pk=black_image.data["id"]).is_main

    other_product, other_size, other_color = make_product(
        "Women",
        "Clothing",
        "S",
        "clothing",
    )
    other_variant = variant(
        other_product,
        other_size,
        other_color,
        "female",
        "WOMEN-OTHER",
    )
    other_variant.full_clean()
    other_variant.save()
    rejected = admin_client.patch(
        f"/api/admin/product-images/{red_image.data['id']}/",
        {"product_variant": other_variant.id},
        format="json",
    )

    assert rejected.status_code == 400
