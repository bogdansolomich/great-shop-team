'use client';

import Image from 'next/image';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import ProductShowcase from '@/widgets/ProductShowcase/ProductShowcase';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetProductCardQuery } from '@/store/endpoints/productsEndpoints';

import styles from './Product.module.scss';

export default function Product() {
  const { t } = useTranslation();
  const { data: productCard, isLoading, isError, error } = useGetProductCardQuery();

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
      <div className={styles.catalog}>
        <h2 className={styles.catalogTitle}>{t.product.youMayAlsoLike}</h2>
        <div className={styles.catalogList}>
          {productCard.botonImages.map((item, key) => (
            <div key={key} className={styles.catalogProduct}>
              <Image src={item.image.src} alt={item.image.alt} width={413} height={387} />
              <button className={styles.btnAdd}>{t.product.like}</button>
              <div className={styles.titleInfoImage}>
                <ul>{item.title}</ul>
                <ul>{item.price}</ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
