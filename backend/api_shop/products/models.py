from addons.mixins import TimeStampMixin
from brands.models import Brand
from categories.models import Subcategory
from django.db import models


class Product(TimeStampMixin):
    product_code = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    name_uk = models.CharField(max_length=255, blank=True, default="")
    name_en = models.CharField(max_length=255, blank=True, default="")
    slug = models.SlugField(unique=True)

    description = models.TextField(
        max_length=500,
        blank=True,
    )
    description_uk = models.TextField(max_length=500, blank=True, default="")
    description_en = models.TextField(max_length=500, blank=True, default="")
    brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name="products",
    )

    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.CASCADE,
        related_name="products",
    )

    is_active = models.BooleanField(default=True)
    is_hidden = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["subcategory"]),
            models.Index(fields=["brand", "subcategory"]),
        ]
