from django.db import migrations, models

import product_images.utils


class Migration(migrations.Migration):

    dependencies = [
        ("product_images", "0006_productimage_source_url_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.ImageField(
                max_length=500,
                upload_to=product_images.utils.product_image_upload_path,
            ),
        ),
    ]
