'use client';

import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import { useCatalogProducts } from '@/features/catalog/lib/useCatalogProducts';
import CatalogBanner from '@/features/catalog/ui/CatalogBanner/CatalogBanner';
import CatalogLoadMore from '@/features/catalog/ui/CatalogLoadMore/CatalogLoadMore';
import CatalogProductGrid from '@/features/catalog/ui/CatalogProductGrid/CatalogProductGrid';
import CatalogToolbar from '@/features/catalog/ui/CatalogToolbar/CatalogToolbar';
import { catalogPage } from '@/features/catalog/ui/catalogClasses';

type CatalogPageProps = {
  category: CatalogCategory;
};

export default function CatalogPage({ category }: CatalogPageProps) {
  const products = useCatalogProducts(category);

  return (
    <div className="mb-[180px]">
      <CatalogBanner category={category} />

      <div id="catalog-products" className={catalogPage.content}>
        <CatalogToolbar stylesCount={products.length} />

        <CatalogProductGrid products={products} />

        <CatalogLoadMore viewed={products.length} total={products.length} />
      </div>
    </div>
  );
}
