import { catalogCategoriesConfig } from '@/features/catalog/config/catalogCategories';
import type { CatalogListingSlug } from '@/features/catalog/model/catalogCategory';

const catalogMenuImages: Record<CatalogListingSlug, string> = {
  men: '/images/Mega/Men.png',
  women: '/images/Mega/Women.png',
  accessories: '/images/Mega/Accessories.png',
  fragrances: '/images/Mega/Perfume.png',
  shoes: '/images/Mega/Shoes.png',
};

export const catalogMenuCategories: Array<{
  slug: CatalogListingSlug;
  href: string;
  image: string;
}> = (Object.keys(catalogMenuImages) as CatalogListingSlug[]).map((slug) => ({
  slug,
  href: catalogCategoriesConfig[slug].href,
  image: catalogMenuImages[slug],
}));
