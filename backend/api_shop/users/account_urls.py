from django.urls import path

from users.views import AccountMeView, AccountOrderListView

urlpatterns = [
    path("me/", AccountMeView.as_view(), name="account-me"),
    path("orders/", AccountOrderListView.as_view(), name="account-orders"),
]
