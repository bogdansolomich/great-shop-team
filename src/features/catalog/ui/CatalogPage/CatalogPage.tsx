'use client';

import Image from 'next/image';

import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import products from '@/data/products.json';

import styles from './CatalogPage.module.scss';

export default function CatalogPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.catalog}>
      <h1>{t.catalog.title}</h1>

      <div className={styles.catalogHeader}>
        <div className={styles.catalogFilters}>
          <div className={styles.catalogFilter}>
            {t.catalog.sort}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
              />
            </svg>
          </div>

          <div className={styles.catalogFilter}>
            {t.catalog.filter}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
          </div>
        </div>

        <div className={styles.catalogInfo}>
          <span className={styles.catalogCount}>
            {formatMessage(t.catalog.stylesFound, { count: 320 })}
          </span>
        </div>
      </div>

      <div className={styles.catalogProducts}>
        {products.map((product, index) => (
          <div key={index} className={styles.catalogProduct}>
            <div className={styles.catalogProductImage}>
              <Image src={product.image.src} alt={product.image.alt} width={413} height={387} />
              <button type="button" className={styles.catalogProductButton} aria-label={t.catalog.addToCart}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <div className={styles.catalogProductInfo}>
              <h4 className={styles.catalogProductTitle}>{product.title}</h4>
              <span className={styles.catalogProductPrice}>{product.price}</span>
            </div>
            <a href="#" className="bit-primary-thin">
              {t.catalog.moreColours}
            </a>
          </div>
        ))}
      </div>

      <div className={styles.catalogPagination}>
        <p className={styles.catalogPaginationInfo}>
          {formatMessage(t.catalog.viewedProducts, { viewed: 72, total: '6,499' })}
        </p>
        <button type="button" className={styles.catalogPaginationButton}>
          {t.catalog.loadMore}
        </button>
      </div>
    </div>
  );
}
