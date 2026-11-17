'use client';

import { useMemo } from 'react';

import { useCatalogListing } from '@/features/catalog/lib/useCatalogListing';
import { catalogGrid } from '@/features/catalog/ui/catalogClasses';
import LandingProductCard from '@/features/landing/ui/sections/LandingProductCard/LandingProductCard';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetProductVariantsQuery } from '@/store/endpoints/catalogMetaEndpoints';
import { useGetFavoritesQuery } from '@/store/endpoints/favoritesEndpoints';

function EmptyHeart() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
      className="size-16 text-neutral-300"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

export default function AccountFavorites() {
  const { t } = useTranslation();
  const { items } = useWishlist();
  const favoritesQuery = useGetFavoritesQuery();
  const variantsQuery = useGetProductVariantsQuery();
  const { products, isLoading, isError } = useCatalogListing('all');

  const cards = useMemo(() => {
    const variantProductId = new Map(
      (variantsQuery.data ?? []).map((variant) => [Number(variant.id), String(variant.product)]),
    );
    const ids = new Set<string>();

    for (const favorite of favoritesQuery.data ?? []) {
      if (favorite.productId) ids.add(favorite.productId);
      const productId = variantProductId.get(favorite.variantId);
      if (productId) ids.add(productId);
    }

    for (const item of items) {
      if (item.productId) ids.add(item.productId);
    }

    return products.filter((product) => ids.has(product.id));
  }, [favoritesQuery.data, items, products, variantsQuery.data]);

  const pending = favoritesQuery.isLoading || variantsQuery.isLoading || isLoading;

  if (pending && cards.length === 0) {
    return <p className="m-0 text-sm text-dark/70">{t.common.loading}</p>;
  }

  if (isError && cards.length === 0 && (favoritesQuery.data?.length ?? 0) > 0) {
    return <p className="m-0 text-sm text-dark/70">{t.common.error}</p>;
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyHeart />
        <p className="m-0 max-w-sm text-sm text-dark/70">{t.account.favoritesEmpty}</p>
      </div>
    );
  }

  return (
    <div className={catalogGrid.root}>
      {cards.map((product) => (
        <LandingProductCard
          key={product.id}
          id={product.id}
          href={product.href}
          image={product.image}
          title={product.title}
          price={product.price}
          compareAt={product.compareAt}
          badge={product.badge}
          ctaLabel={t.landing.addToCart}
          addToCartLine={product.cartLine}
        />
      ))}
    </div>
  );
}
