'use client';

import { useMemo } from 'react';

import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import products from '@/data/products.json';

const allProducts = products as CatalogProduct[];

export function useCatalogProducts(category: CatalogCategory) {
  return useMemo(() => allProducts.filter((product) => product.category === category), [category]);
}

export function getCatalogProductsCount(category: CatalogCategory) {
  return allProducts.filter((product) => product.category === category).length;
}
