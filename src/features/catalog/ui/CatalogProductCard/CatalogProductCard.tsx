'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import { catalogProductCard } from '@/features/catalog/ui/catalogClasses';
import { useTranslation } from '@/i18n/useTranslation';

type CatalogProductCardProps = {
  product: CatalogProduct;
  onAddToCart?: (selectedSize?: string) => void;
  onAddToWishlist?: () => void;
};

const getProductCategoryPath = (product: CatalogProduct): string => {
  // 1. Если бэкенд или мок уже дали готовый href, берём его
  if (product.href) return product.href;

  // 2. Безопасно достаем текстовое имя категории
  let categoryName = '';

  if (typeof product.category === 'string') {
    categoryName = product.category;
  } else if (product.category && typeof product.category === 'object') {
    // Кастуем через unknown, чтобы избежать сужения в type 'never'
    const categoryObj = product.category as unknown as { id?: string; name?: string };
    categoryName = categoryObj.id || categoryObj.name || '';
  }

  const normalizedCategory = categoryName.toLowerCase();
  const normalizedSubcategory = (product.subcategory || '').toLowerCase();

  // 3. Распределяем по роутам в зависимости от категории/подкатегории
  if (normalizedSubcategory === 'fragrances' || normalizedCategory === 'fragrances') {
    return `/catalog/fragrances/${product.id}`;
  }
  if (normalizedCategory === 'accessories' || normalizedSubcategory === 'accessories') {
    return `/catalog/accessories/${product.id}`;
  }
  if (normalizedCategory === 'women' || product.id.startsWith('w-')) {
    return `/catalog/women/${product.id}`;
  }

  // Фолбэк по умолчанию (мужские вещи или если ничего не совпало)
  return `/catalog/men/${product.id}`;
};

export default function CatalogProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
}: CatalogProductCardProps) {
  const { t } = useTranslation();

  // 💡 ВЫЗЫВАЕМ НАШУ ФУНКЦИЮ ЗДЕСЬ, чтобы гарантировать строку
  const cardHref = getProductCategoryPath(product);

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] ?? '');

  const isFragrance = product.subcategory === 'fragrances';
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const canAddToCart = product.inStock;

  return (
    <article className={catalogProductCard.root}>
      <div className="relative mb-4 flex aspect-413/493 w-full items-center justify-center bg-[#FAFAFA]">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(max-width: 768px) 100vw, 258px"
          className="object-contain mix-blend-multiply"
        />

        <button
          type="button"
          className="absolute top-4 right-4 cursor-pointer border-none bg-transparent p-1 text-dark hover:scale-110 transition-transform"
          onClick={onAddToWishlist}
          aria-label={t.landing.addToWishlist}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>

        <button
          type="button"
          className={catalogProductCard.addToCartBtn}
          onClick={() => canAddToCart && onAddToCart?.(selectedSize)}
          disabled={!canAddToCart}
          aria-disabled={!canAddToCart}
          aria-label={canAddToCart ? t.landing.addToCart : t.catalog.outOfStock}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className={catalogProductCard.meta}>
        <div className="flex flex-col gap-1">
          <h4>{product.title}</h4>
        </div>
        <span className="font-medium whitespace-nowrap">{product.price}</span>
      </div>

      {hasSizes && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t.catalog.addToCart}>
          {product.sizes!.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                className={`cursor-pointer rounded-[10px] border px-4 py-3 text-sm transition-all duration-200 ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 bg-transparent text-neutral-800 hover:border-black'
                }`}
                onClick={() => setSelectedSize(size)}
                aria-pressed={isSelected}
                disabled={!canAddToCart}
              >
                {size}
              </button>
            );
          })}
        </div>
      )}

      {!isFragrance ? (
        /* 👇 ЗАМЕНИЛИ product.href НА НАШ ВЫЧИСЛЕННЫЙ cardHref */
        <Link href={cardHref} className="bit-primary-thin mt-3 inline-block">
          {t.catalog.moreColours}
        </Link>
      ) : null}

      <p className={catalogProductCard.stockStatus} aria-live="polite">
        {!canAddToCart ? t.catalog.outOfStock : '\u00a0'}
      </p>
    </article>
  );
}
