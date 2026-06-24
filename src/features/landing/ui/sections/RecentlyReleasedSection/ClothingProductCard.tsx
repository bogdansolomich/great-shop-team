'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import { useTranslation } from '@/i18n/useTranslation';

type ClothingProductCardProps = {
  product: CatalogProduct;
};

const getProductCategoryPath = (product: CatalogProduct): string => {
  console.log('Product ID для проверки:', product?.id); // Это точно должно появиться в консоли F12

  if (!product) return '#';
  if (product.href) return product.href;

  const productId = product.id || '';

  // 1. Проверяем по префиксам ID (самый надежный способ для вашей структуры)
  if (productId.startsWith('m-')) {
    return `/catalog/men/${productId}`;
  }
  if (productId.startsWith('w-')) {
    return `/catalog/women/${productId}`;
  }

  // 2. Если префиксов нет, проверяем текстовое поле категории
  let categoryName = '';
  if (typeof product.category === 'string') {
    categoryName = product.category;
  } else if (product.category && typeof product.category === 'object') {
    const categoryObj = product.category as unknown as { id?: string; name?: string };
    categoryName = categoryObj.id || categoryObj.name || '';
  }

  const normalizedCategory = categoryName.toLowerCase();

  if (normalizedCategory === 'men') {
    return `/catalog/men/${productId}`;
  }
  if (normalizedCategory === 'women') {
    return `/catalog/women/${productId}`;
  }

  // 3. Абсолютно все остальные товары (включая парфюм/fragrances) отправляем в папку accessories
  return `/catalog/accessories/${productId}`;
};

export default function ClothingProductCard({ product }: ClothingProductCardProps) {
  const { t } = useTranslation();

  // Безопасно вычисляем ссылку
  const cardHref = getProductCategoryPath(product);

  const imageSrc =
    product?.image?.src ||
    (product && 'imageUrl' in product ? (product as { imageUrl: string }).imageUrl : '');

  const imageAlt = product?.image?.alt || product?.title || 'product';
  return (
    <article className="flex w-full max-w-103.25 flex-col">
      <div className="relative mb-4 flex aspect-413/493 w-full items-center justify-center bg-[#FAFAFA]">
        <div className="mx-auto flex h-[78.5%] w-fit items-stretch gap-2">
          <Link
            href={cardHref}
            className="relative aspect-258/387 h-full shrink-0 overflow-hidden sub-link-wrapper"
          >
            {imageSrc ? (
              <Image src={imageSrc} alt={imageAlt} fill sizes="258px" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </Link>

          <div className="flex shrink-0 flex-col items-center justify-between py-4">
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-1 text-dark"
              aria-label={t.landing.addToWishlist}
            >
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
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-black text-white"
              aria-label={t.landing.addToCart}
            >
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
      <div className="mx-auto flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Link href={cardHref} className="hover:underline">
            <h3 className="m-0 font-(family-name:--font-poppins) text-base font-normal">
              {product?.title || ''}
            </h3>
          </Link>
          <Link href={cardHref} className="btn-outline">
            {t.landing.showMore}
          </Link>
        </div>
        <span className="text-base font-medium whitespace-nowrap">{product?.price || ''}</span>
      </div>
    </article>
  );
}
