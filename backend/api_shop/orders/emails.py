from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape

from .models import Order


class EmailSendError(Exception):
    """The order email could not be delivered. The checkout must be rolled back."""


_SUBJECTS = {
    "uk": "Ваше замовлення від Wearly отримано",
    "en": "Your order from Wearly has been received",
}

_PAYMENT_LABELS = {
    "uk": {
        "google": "Google Pay",
        "visa": "Visa",
        "mastercard": "Mastercard",
    },
    "en": {
        "google": "Google Pay",
        "visa": "Visa",
        "mastercard": "Mastercard",
    },
}


def wearly_from_email() -> str:
    """Sender header. The address stays the verified one; the name is the shop."""
    configured = (settings.DEFAULT_FROM_EMAIL or "").strip()
    if "<" in configured and ">" in configured:
        address = configured.split("<", 1)[1].split(">", 1)[0].strip()
    else:
        address = configured
    return f"Wearly-shop <{address}>"


def _language(value: str | None) -> str:
    return "en" if value == "en" else "uk"


def _money(amount, currency_code: str) -> str:
    quantized = Decimal(amount).quantize(Decimal("0.01"))
    return f"{quantized} {currency_code}"


def _payment_label(language: str, payment_method: str) -> str:
    labels = _PAYMENT_LABELS[language]
    if payment_method in labels:
        return labels[payment_method]
    return "Не вказано" if language == "uk" else "Not specified"


def _copy(order: Order, language: str, payment_method: str) -> dict[str, str]:
    payment = _payment_label(language, payment_method)
    if language == "en":
        return {
            "greeting": f"Hello, {order.first_name} {order.last_name}!",
            "intro": (
                f"Thank you for shopping at Wearly. "
                f"We have received your order #{order.pk}."
            ),
            "items_title": "Items",
            "delivery": "Delivery",
            "phone": "Phone",
            "email": "Email",
            "payment": "Payment",
            "comment": "Comment",
            "promo": "Promo code",
            "promo_discount": "Promo discount",
            "total": "Total",
            "payment_value": payment,
            "footer": "Wearly will contact you if anything about the delivery changes.",
            "signoff": "Wearly",
        }
    return {
        "greeting": f"Вітаємо, {order.first_name} {order.last_name}!",
        "intro": (
            f"Дякуємо за покупку у Wearly. "
            f"Ми отримали ваше замовлення №{order.pk}."
        ),
        "items_title": "Товари",
        "delivery": "Доставка",
        "phone": "Телефон",
        "email": "Email",
        "payment": "Оплата",
        "comment": "Коментар",
        "promo": "Промокод",
        "promo_discount": "Знижка за промокод",
        "total": "Разом",
        "payment_value": payment,
        "footer": "Wearly напише, якщо в доставці щось зміниться.",
        "signoff": "Wearly",
    }


def _line_rows(order: Order) -> list[str]:
    rows = []
    for item in order.items.all():
        rows.append(
            f"{item.product_name} ({item.sku}), {item.color}, {item.size} "
            f"× {item.quantity} — {_money(item.line_total, order.currency_code)}"
        )
    return rows


def _plain_body(order: Order, language: str, payment_method: str) -> str:
    copy = _copy(order, language, payment_method)
    lines = [
        copy["greeting"],
        "",
        copy["intro"],
        "",
        f"{copy['items_title']}:",
        *[f"- {row}" for row in _line_rows(order)],
        "",
        f"{copy['delivery']}: {order.shipping_address}",
        f"{copy['phone']}: {order.phone}",
        f"{copy['email']}: {order.email}",
        f"{copy['payment']}: {copy['payment_value']}",
    ]
    if order.comment:
        lines.append(f"{copy['comment']}: {order.comment}")
    if order.promo_code:
        lines.append(
            f"{copy['promo']}: {order.promo_code} "
            f"(-{_money(order.promo_discount, order.currency_code)})"
        )
    lines.extend(
        [
            "",
            f"{copy['total']}: {_money(order.total_amount, order.currency_code)}",
            "",
            copy["footer"],
            "",
            copy["signoff"],
        ]
    )
    return "\n".join(lines)


def _html_body(order: Order, language: str, payment_method: str) -> str:
    copy = _copy(order, language, payment_method)
    item_rows = []
    for item in order.items.all():
        item_rows.append(
            "<tr>"
            f"<td style=\"padding:8px 0;border-bottom:1px solid #eee;\">{escape(item.product_name)}<br>"
            f"<span style=\"color:#646464;font-size:13px;\">"
            f"SKU: {escape(item.sku)} · {escape(item.color)} · {escape(item.size)} · × {item.quantity}"
            "</span></td>"
            f"<td style=\"padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;\">"
            f"{escape(_money(item.line_total, order.currency_code))}</td>"
            "</tr>"
        )
    comment_row = ""
    if order.comment:
        comment_row = (
            f"<p style=\"margin:4px 0;\"><strong>{escape(copy['comment'])}:</strong> "
            f"{escape(order.comment)}</p>"
        )
    promo_row = ""
    if order.promo_code:
        promo_row = (
            f"<p style=\"margin:4px 0;\"><strong>{escape(copy['promo'])}:</strong> "
            f"{escape(order.promo_code)} "
            f"(-{escape(_money(order.promo_discount, order.currency_code))})</p>"
        )
    return f"""\
<div style="font-family:Arial,sans-serif;color:#131118;max-width:560px;margin:0 auto;">
  <p style="font-size:22px;font-weight:700;letter-spacing:0.08em;margin:0 0 16px;">WEARLY</p>
  <p style="font-size:16px;margin:0 0 8px;">{escape(copy['greeting'])}</p>
  <p style="font-size:15px;line-height:1.5;margin:0 0 20px;">{escape(copy['intro'])}</p>
  <p style="font-size:14px;font-weight:700;margin:0 0 8px;">{escape(copy['items_title'])}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">{''.join(item_rows)}</table>
  <p style="font-size:18px;font-weight:700;margin:16px 0;">
    {escape(copy['total'])}: {escape(_money(order.total_amount, order.currency_code))}
  </p>
  <p style="margin:4px 0;"><strong>{escape(copy['delivery'])}:</strong> {escape(order.shipping_address)}</p>
  <p style="margin:4px 0;"><strong>{escape(copy['phone'])}:</strong> {escape(order.phone)}</p>
  <p style="margin:4px 0;"><strong>{escape(copy['email'])}:</strong> {escape(order.email)}</p>
  <p style="margin:4px 0;"><strong>{escape(copy['payment'])}:</strong> {escape(copy['payment_value'])}</p>
  {promo_row}
  {comment_row}
  <p style="color:#646464;font-size:13px;margin-top:24px;">{escape(copy['footer'])}</p>
</div>
"""


def send_order_confirmation(order: Order, *, language: str | None, payment_method: str | None) -> None:
    """Email the buyer. Raises EmailSendError so the checkout transaction rolls back."""
    lang = _language(language)
    method = payment_method or ""
    try:
        send_mail(
            _SUBJECTS[lang],
            _plain_body(order, lang, method),
            wearly_from_email(),
            [order.email],
            html_message=_html_body(order, lang, method),
        )
    except Exception as exc:
        raise EmailSendError("Could not send the order email.") from exc
