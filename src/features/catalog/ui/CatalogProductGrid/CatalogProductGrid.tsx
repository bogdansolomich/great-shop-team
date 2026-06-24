'use client';

import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import CatalogProductCard from '@/features/catalog/ui/CatalogProductCard/CatalogProductCard';
import { catalogGrid } from '@/features/catalog/ui/catalogClasses';

type CatalogProductGridProps = {
  products: CatalogProduct[];
  onAddToCart?: (product: CatalogProduct) => void;
};

export default function CatalogProductGrid({ products, onAddToCart }: CatalogProductGridProps) {
  return (
    <div className={catalogGrid.root}>
      {products.map((product) => (
        <CatalogProductCard
          key={product.id}
          product={product} // Просто прокидываем объект дальше
          onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
        />
      ))}
    </div>
  );
}
