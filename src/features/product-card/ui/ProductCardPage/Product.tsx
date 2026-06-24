'use client';

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import ProductShowcase from '@/widgets/ProductShowcase/ProductShowcase';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetProductCardQuery } from '@/store/endpoints/productsEndpoints';
import { useParams } from 'next/navigation';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import ClothingProductCard from '@/features/catalog/ui/CatalogProductCard/CatalogProductCard';

export default function Product() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params.id as string;
  const { data: productCard, isLoading, isError, error } = useGetProductCardQuery(id);

  if (isLoading) {
    return <div>{t.common.loading}</div>;
  }

  if (isError || !productCard) {
    const queryError = error as FetchBaseQueryError | undefined;
    const errorStatus =
      queryError && 'originalStatus' in queryError
        ? queryError.originalStatus
        : queryError && 'status' in queryError
          ? queryError.status
          : null;
    const errorMessage =
      errorStatus === 404
        ? 'Product API endpoint /api/products/product-card/ was not found on the server.'
        : errorStatus
          ? `${t.common.error}: ${String(errorStatus)}`
          : t.common.error;

    return <div>{errorMessage}</div>;
  }

  return (
    <div>
      <ProductShowcase
        brand={productCard.brand}
        title={productCard.title}
        description={productCard.description}
        price={productCard.price}
        code={productCard.code}
        size={productCard.size}
        rating={productCard.rating}
        images={productCard.images}
        link={productCard.link}
      />

      {/* Сетка блока рекомендаций (Tailwind) */}
      <div className="m-[2%]">
        <h2 className="m-[2%] text-[36px] font-normal">{t.product.youMayAlsoLike}</h2>

        <div className="relative flex gap-[2%]">
          {productCard.botonImages?.slice(0, 3).map((item, key) => (
            <ClothingProductCard
              key={key}
              /* Просто прокидываем item. Умная карточка сама разберется с категориями 
                и сформирует правильный URL без падений и ошибок компиляции!
              */
              product={item as unknown as CatalogProduct}
              onAddToCart={(size) => console.log('Add to cart:', item.id, size)}
              onAddToWishlist={() => console.log('Add to wishlist:', item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
