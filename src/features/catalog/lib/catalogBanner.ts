import { catalogCategoriesConfig } from '@/features/catalog/config/catalogCategories';
import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';

/** Banner image path for a catalog category (files live in /public). */
export function getCatalogBannerImageSrc(category: CatalogCategory) {
  return catalogCategoriesConfig[category].bannerImageSrc;
}
