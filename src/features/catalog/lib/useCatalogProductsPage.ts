'use client';

import { useCallback, useMemo, useState } from 'react';

import { CATALOG_PAGE_SIZE } from '@/features/catalog/config/catalogPagination';
import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import { useCatalogProducts } from '@/features/catalog/lib/useCatalogProducts';

export function useCatalogProductsPage(category: CatalogCategory) {
  const products = useCatalogProducts(category);
  const [pagination, setPagination] = useState({
    category,
    visibleCount: CATALOG_PAGE_SIZE,
  });

  if (pagination.category !== category) {
    setPagination({ category, visibleCount: CATALOG_PAGE_SIZE });
  }

  const { visibleCount } = pagination;

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  const loadMore = useCallback(() => {
    setPagination((current) => ({
      ...current,
      visibleCount: Math.min(current.visibleCount + CATALOG_PAGE_SIZE, products.length),
    }));
  }, [products.length]);

  const hasMore = visibleCount < products.length;

  return {
    products: visibleProducts,
    total: products.length,
    viewed: visibleProducts.length,
    hasMore,
    loadMore,
  };
}
