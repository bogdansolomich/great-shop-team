import pytest
from django.contrib.auth import get_user_model
from profiles.models import Profile
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_authenticated_user_only_sees_their_own_profile(api_client, user, other_user):
    response = api_client.get("/api/profiles/")

    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [user.profile.id]
    assert other_user.profile.id not in [item["id"] for item in response.data]


@pytest.mark.django_db
def test_staff_user_can_read_and_update_their_own_profile():
    staff_user = User.objects.create_user(
        email="staff-profile@example.com",
        password="test-password",
        is_active=True,
        is_staff=True,
    )
    profile = Profile.objects.get(user=staff_user)
    client = APIClient()
    client.force_authenticate(user=staff_user)

    response = client.get(f"/api/profiles/{profile.id}/")

    assert response.status_code == 200
    assert response.data["id"] == profile.id

    updated = client.patch(
        f"/api/profiles/{profile.id}/",
        {"first_name": "Staff"},
        format="json",
    )
    assert updated.status_code == 200
    profile.refresh_from_db()
    assert profile.first_name == "Staff"


@pytest.mark.django_db
def test_user_cannot_access_another_users_profile(api_client, other_user):
    response = api_client.get(f"/api/profiles/{other_user.profile.id}/")

    assert response.status_code == 404
