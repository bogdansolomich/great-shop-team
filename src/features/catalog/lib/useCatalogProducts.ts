'use client';

import { useMemo } from 'react';

import { mapProductToCatalogCard, parseProducts } from '@/entities/product';
import productsMock from '@/data/products.json';
import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import type { Product } from '@/entities/product/model/types';
import { useTranslation } from '@/i18n/useTranslation';

const allProducts: Product[] = parseProducts(productsMock);

export function useCatalogProducts(category: CatalogCategory) {
  const { locale } = useTranslation();

  return useMemo(
    () =>
      allProducts
        .filter((product) => product.category === category)
        .map((product) => mapProductToCatalogCard(product, locale)),
    [category, locale],
  );
}

export function getCatalogProductsCount(category: CatalogCategory) {
  return allProducts.filter((product) => product.category === category).length;
}

export function getProductById(id: string) {
  return allProducts.find((product) => product.id === id) ?? null;
}

export function getProductBySlug(slug: string) {
  return allProducts.find((product) => product.slug === slug) ?? null;
}
