export const CATALOG_CATEGORY_SLUGS = ['men', 'women', 'accessories'] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORY_SLUGS)[number];

export function isCatalogCategory(value: string): value is CatalogCategory {
  return CATALOG_CATEGORY_SLUGS.includes(value as CatalogCategory);
}
