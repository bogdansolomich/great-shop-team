import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';

export type CatalogProduct = {
  category: CatalogCategory;
  image: {
    src: string;
    alt: string;
  };
  title: string;
  price: string;
};
