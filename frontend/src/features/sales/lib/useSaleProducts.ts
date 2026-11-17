'use client';

import { useMemo } from 'react';

import { useCatalogListing } from '@/features/catalog/lib/useCatalogListing';
import { formatCatalogPrice } from '@/features/catalog/lib/resolveVariantOffer';
import {
  discountBadge,
  isDiscountCurrent,
  salePrice,
  variantLabel,
  variantOffer,
} from '@/features/sales/lib/saleOffer';
import { useTranslation } from '@/i18n/useTranslation';
import {
  useGetColorsQuery,
  useGetCurrenciesQuery,
  useGetProductVariantsQuery,
  useGetSizesQuery,
} from '@/store/endpoints/catalogMetaEndpoints';
import { useGetDiscountsQuery } from '@/store/endpoints/discountsEndpoints';
import type { CartItem, Discount } from '@/store/types';

export type SaleProduct = {
  discount: Discount;
  productId: string;
  href: string;
  productHref: string;
  image: { src: string; alt: string };
  title: string;
  saleAmount: number;
  price: string;
  compareAt: string;
  badge: string;
  cartLine: Omit<CartItem, 'quantity'> | null;
};

export function useSaleProducts() {
  const { locale } = useTranslation();
  const listing = useCatalogListing('all');
  const discountsQuery = useGetDiscountsQuery();
  const variantsQuery = useGetProductVariantsQuery();
  const currenciesQuery = useGetCurrenciesQuery();
  const colorsQuery = useGetColorsQuery();
  const sizesQuery = useGetSizesQuery();

  const resolve = useMemo(() => {
    const products = listing.products;
    const variants = variantsQuery.data ?? [];
    const variantById = new Map(variants.map((variant) => [Number(variant.id), variant]));
    const productById = new Map(products.map((product) => [Number(product.id), product]));
    const colorsById = new Map((colorsQuery.data ?? []).map((color) => [Number(color.id), color]));
    const sizesById = new Map((sizesQuery.data ?? []).map((size) => [Number(size.id), size]));

    return (discount: Discount): SaleProduct | null => {
      const variant = variantById.get(Number(discount.product_variant));
      if (!variant) return null;

      const product = productById.get(Number(variant.product));
      const offer = variantOffer(variant, currenciesQuery.data, locale);
      if (!product || !offer) return null;

      const nextPrice = salePrice(offer.amount, discount);
      if (nextPrice >= offer.amount) return null;

      const labels = variantLabel(variant, colorsById, sizesById);
      const cartLine: Omit<CartItem, 'quantity'> = {
        productId: Number(product.id),
        variantId: Number(variant.id),
        brand: product.brandName ?? product.cartLine?.brand ?? '',
        title: product.title,
        price: offer.amount,
        currency: offer.currency,
        imageSrc: product.image.src,
        imageAlt: product.image.alt,
        sku: variant.sku,
        color: labels.color || product.cartLine?.color || '',
        size: labels.size || product.cartLine?.size || '',
      };

      return {
        discount,
        productId: product.id,
        href: `/sales/${discount.id}`,
        productHref: product.href,
        image: product.image,
        title: product.title,
        saleAmount: nextPrice,
        price: formatCatalogPrice(nextPrice, offer.currency, locale),
        compareAt: formatCatalogPrice(offer.amount, offer.currency, locale),
        badge: discountBadge(discount, locale, offer.currency),
        cartLine,
      };
    };
  }, [
    listing.products,
    variantsQuery.data,
    currenciesQuery.data,
    colorsQuery.data,
    sizesQuery.data,
    locale,
  ]);

  const items = useMemo(() => {
    const bestByProduct = new Map<number, SaleProduct>();

    (discountsQuery.data ?? [])
      .filter((discount) => isDiscountCurrent(discount))
      .forEach((discount) => {
        const item = resolve(discount);
        if (!item) return;
        const current = bestByProduct.get(Number(item.productId));
        if (current && current.saleAmount <= item.saleAmount) return;
        bestByProduct.set(Number(item.productId), item);
      });

    return [...bestByProduct.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [discountsQuery.data, resolve]);

  const isLoading =
    listing.isLoading ||
    discountsQuery.isLoading ||
    variantsQuery.isLoading ||
    currenciesQuery.isLoading;

  const isError = listing.isError || Boolean(discountsQuery.isError);

  return { items, resolve, isLoading, isError };
}
