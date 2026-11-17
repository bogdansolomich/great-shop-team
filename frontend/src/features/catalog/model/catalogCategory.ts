export const CATALOG_CATEGORY_SLUGS = ['men', 'women', 'accessories'] as const;
export const CATALOG_LISTING_SLUGS = [
  'men',
  'women',
  'accessories',
  'fragrances',
  'shoes',
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORY_SLUGS)[number];
export type CatalogListingSlug = (typeof CATALOG_LISTING_SLUGS)[number];
export type CatalogScope = CatalogListingSlug | 'all';

/**
 * Sections the full catalog can be narrowed to, in the order the filter lists them.
 * "clothing" is the clothes of both men and women, so it never includes shoes.
 */
export const CATALOG_GROUPS = [
  'men',
  'women',
  'clothing',
  'shoes',
  'accessories',
  'fragrances',
] as const;
export type CatalogProductGroup = (typeof CATALOG_GROUPS)[number];

export function isCatalogCategory(value: string): value is CatalogCategory {
  return CATALOG_CATEGORY_SLUGS.includes(value as CatalogCategory);
}

export function isCatalogListingSlug(value: string): value is CatalogListingSlug {
  return CATALOG_LISTING_SLUGS.includes(value as CatalogListingSlug);
}

export function isCatalogScope(value: string): value is CatalogScope {
  return value === 'all' || isCatalogListingSlug(value);
}

function subcategoryLabel(subcategory?: { slug?: string; name?: string } | string) {
  return typeof subcategory === 'string'
    ? subcategory
    : `${subcategory?.slug ?? ''} ${subcategory?.name ?? ''}`;
}

export function isFragranceSubcategory(subcategory?: { slug?: string; name?: string } | string) {
  return /fragran|perfume|parfum/i.test(subcategoryLabel(subcategory));
}

export function isShoeSubcategory(subcategory?: { slug?: string; name?: string } | string) {
  return /shoe|sneaker|boot|footwear/i.test(subcategoryLabel(subcategory));
}

export function resolveProductCatalogCategory(args: {
  productName: string;
  subcategoryCategoryId?: number;
  subcategorySlug?: string;
  subcategoryName?: string;
  categoryIdBySlug: Map<string, number>;
  genders: Array<'male' | 'female' | 'unisex'>;
}): CatalogListingSlug {
  const {
    productName,
    subcategoryCategoryId,
    subcategorySlug,
    subcategoryName,
    categoryIdBySlug,
    genders,
  } = args;

  const parentSlug = [...categoryIdBySlug.entries()].find(
    ([, id]) => id === subcategoryCategoryId,
  )?.[0];
  const subcategoryLabel = `${subcategorySlug ?? ''} ${subcategoryName ?? ''}`;

  if (
    parentSlug === 'perfumes' ||
    parentSlug === 'fragrances' ||
    isFragranceSubcategory({ slug: subcategorySlug, name: subcategoryName })
  ) {
    return 'fragrances';
  }

  if (
    parentSlug === 'shoes' ||
    isShoeSubcategory({ slug: subcategorySlug, name: subcategoryName })
  ) {
    return 'shoes';
  }

  if (parentSlug === 'accessories' || /accessor/i.test(subcategoryLabel)) {
    return 'accessories';
  }

  if (parentSlug === 'men' && /cloth/i.test(subcategoryLabel)) return 'men';
  if (parentSlug === 'women' && /cloth/i.test(subcategoryLabel)) return 'women';

  if (genders.length > 0) {
    const hasMale = genders.some((gender) => gender === 'male');
    const hasFemale = genders.some((gender) => gender === 'female');
    if (hasMale && !hasFemale) return 'men';
    if (hasFemale) return 'women';
  }

  const name = productName.toLowerCase();
  if (/\bwom[ae]n'?s?\b|\bfemale\b|\bladies\b/.test(name)) return 'women';
  if (/\bmen'?s?\b|\bmale\b|\bman\b/.test(name) && !/\bwom/.test(name)) return 'men';

  return 'women';
}

/** Every group a product belongs to: a men's T-shirt is in "men" and also in "clothing". */
export function groupsOfCategory(category: CatalogListingSlug | undefined): CatalogProductGroup[] {
  switch (category) {
    case 'men':
      return ['men', 'clothing'];
    case 'women':
      return ['women', 'clothing'];
    case 'shoes':
      return ['shoes'];
    case 'accessories':
      return ['accessories'];
    case 'fragrances':
      return ['fragrances'];
    default:
      return [];
  }
}
