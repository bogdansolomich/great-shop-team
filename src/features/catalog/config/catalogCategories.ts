import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';

type CatalogCategoryConfig = {
  href: `/catalog/${CatalogCategory}`;
  bannerImageSrc: string;
};

export const catalogCategoriesConfig: Record<CatalogCategory, CatalogCategoryConfig> = {
  men: {
    href: '/catalog/men',
    bannerImageSrc: '/images/heroBanner.jpg',
  },
  women: {
    href: '/catalog/women',
    bannerImageSrc: '/images/heroBanner.jpg',
  },
  accessories: {
    href: '/catalog/accessories',
    bannerImageSrc: '/images/perfume.png',
  },
};
