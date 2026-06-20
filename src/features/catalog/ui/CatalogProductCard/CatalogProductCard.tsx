'use client';

import Image from 'next/image';

import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import { catalogProductCard } from '@/features/catalog/ui/catalogClasses';
import { useTranslation } from '@/i18n/useTranslation';

type CatalogProductCardProps = {
  product: CatalogProduct;
  onAddToCart?: () => void;
};

export default function CatalogProductCard({ product, onAddToCart }: CatalogProductCardProps) {
  const { t } = useTranslation();

  return (
    <article className={catalogProductCard.root}>
      <div className={catalogProductCard.imageWrap}>
        <Image src={product.image.src} alt={product.image.alt} width={413} height={387} />
        <button
          type="button"
          className={catalogProductCard.addToCartBtn}
          onClick={onAddToCart}
          aria-label={t.catalog.addToCart}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className={catalogProductCard.meta}>
        <h4>{product.title}</h4>
        <span>{product.price}</span>
      </div>

      <a href="#" className="bit-primary-thin">
        {t.catalog.moreColours}
      </a>
    </article>
  );
}
