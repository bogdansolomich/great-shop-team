'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

import styles from './FragranceProductCard.module.scss';

type FragranceProductCardProps = {
  image: { src: string; alt: string };
  title: string;
  price: string;
  sizes: string[];
};

export default function FragranceProductCard({
  image,
  title,
  price,
  sizes,
}: FragranceProductCardProps) {
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? '');

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <div className={styles.imageRow}>
          <div className={styles.imageInner}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="258px"
              className={styles.image}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.wishlist} aria-label={t.landing.addToWishlist}>
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
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </button>
            <button type="button" className={styles.addButton} aria-label={t.landing.addToCart}>
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
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.price}>{price}</span>
      </div>
      {sizes.length > 0 && (
        <div className={styles.sizes} role="group" aria-label={t.landing.selectSize}>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={`${styles.size} ${selectedSize === size ? styles.active : ''}`}
              onClick={() => setSelectedSize(size)}
              aria-pressed={selectedSize === size}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
