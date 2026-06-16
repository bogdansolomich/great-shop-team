'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTranslation } from '@/i18n/useTranslation';

import styles from './ClothingProductCard.module.scss';

type ClothingProductCardProps = {
  image: { src: string; alt: string };
  title: string;
  price: string;
};

export default function ClothingProductCard({ image, title, price }: ClothingProductCardProps) {
  const { t } = useTranslation();

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
        <div className={styles.meta}>
          <h3 className={styles.title}>{title}</h3>
          <Link href="/catalog" className={styles.showMore}>
            {t.landing.showMore}
          </Link>
        </div>
        <span className={styles.price}>{price}</span>
      </div>
    </article>
  );
}
