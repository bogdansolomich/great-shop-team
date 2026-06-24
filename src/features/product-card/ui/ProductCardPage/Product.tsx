'use client';

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import ProductShowcase from '@/widgets/ProductShowcase/ProductShowcase';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetProductCardQuery } from '@/store/endpoints/productsEndpoints';
import { useParams } from 'next/navigation';

import ClothingProductCard from '@/features/catalog/ui/CatalogProductCard/CatalogProductCard';

// Хелпер для динамического определения категории по префиксу ID
const getCategoryFromId = (itemId: string): string => {
  if (itemId.startsWith('m-')) return 'men';
  if (itemId.startsWith('w-')) return 'women';
  return 'accessories';
};

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

      {/* Переписано на Tailwind */}
      <div className="m-[2%]">
        <h2 className="m-[2%] text-[36px] font-normal">{t.product.youMayAlsoLike}</h2>

        <div className="relative flex gap-[2%]">
          {productCard.botonImages?.slice(0, 3).map((item, key) => {
            const currentCategory = getCategoryFromId(item.id);
            const calculatedHref = `/catalog/${currentCategory}/${item.id}`;

            const productData = {
              ...item,
              href: calculatedHref,
              slug: item.id,
              subcategory: '',
              type: '',
              inStock: true,
            };

            return (
              <ClothingProductCard
                key={key}
                product={productData}
                onAddToCart={(size) => console.log('Add to cart:', item.id, size)}
                onAddToWishlist={() => console.log('Add to wishlist:', item.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
