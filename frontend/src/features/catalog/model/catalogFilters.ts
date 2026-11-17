import { CATALOG_GROUPS, type CatalogProductGroup } from '@/features/catalog/model/catalogCategory';
import type { CatalogProduct, CatalogVariantOption } from '@/features/catalog/model/catalogProduct';

export type CatalogSortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'bestsellers';

export type CatalogGenderFilter = 'men' | 'women';
export type CatalogGroupFilter = CatalogProductGroup;

export type CatalogListingFilters = {
  q?: string;
  subcategory?: string[];
  type?: string;
  gender?: CatalogGenderFilter[];
  group?: CatalogGroupFilter[];
  brand?: string[];
  color?: string[];
  size?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSortOption;
};

export const CATALOG_SORT_OPTIONS: CatalogSortOption[] = [
  'featured',
  'price_asc',
  'price_desc',
  'newest',
  'bestsellers',
];

export const CATALOG_GENDER_FILTERS: CatalogGenderFilter[] = ['men', 'women'];
export const CATALOG_GROUP_FILTERS: readonly CatalogGroupFilter[] = CATALOG_GROUPS;

export function isCatalogSortOption(value: string | null | undefined): value is CatalogSortOption {
  return Boolean(value && CATALOG_SORT_OPTIONS.includes(value as CatalogSortOption));
}

export function parsePriceParam(value: string | null | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseCsvParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toCsvParam(values: string[]): string | undefined {
  return values.length > 0 ? values.join(',') : undefined;
}

export function isCatalogGenderFilter(value: string): value is CatalogGenderFilter {
  return CATALOG_GENDER_FILTERS.includes(value as CatalogGenderFilter);
}

export function isCatalogGroupFilter(value: string): value is CatalogGroupFilter {
  return CATALOG_GROUP_FILTERS.includes(value as CatalogGroupFilter);
}

export function parseGenderParams(value: string | null | undefined): CatalogGenderFilter[] {
  return parseCsvParam(value).filter(isCatalogGenderFilter);
}

export function parseGroupParams(value: string | null | undefined): CatalogGroupFilter[] {
  return parseCsvParam(value).filter(isCatalogGroupFilter);
}

/** A filter value is either the numeric id or the (case-insensitive) name of the option. */
function matchesOption(values: ReadonlySet<string>, id?: number, name?: string): boolean {
  return [...values].some(
    (value) =>
      (id != null && String(id) === value) ||
      (name != null && name.toLowerCase() === value.toLowerCase()),
  );
}

/**
 * Color and size must describe the same variant: "Black + XL" must not match a product that is
 * black only in S and has XL only in red. A product with no variants never matches an active one.
 */
export function matchesVariantFilters(
  options: CatalogVariantOption[] | undefined,
  colors: ReadonlySet<string>,
  sizes: ReadonlySet<string>,
): boolean {
  if (colors.size === 0 && sizes.size === 0) return true;

  return (options ?? []).some(
    (option) =>
      (colors.size === 0 || matchesOption(colors, option.colorId, option.colorName)) &&
      (sizes.size === 0 || matchesOption(sizes, option.sizeId, option.sizeName)),
  );
}

/** The first selected color that some variant (in a selected size, if any) really comes in. */
function findMatchingColorId(
  options: CatalogVariantOption[] | undefined,
  colors: ReadonlySet<string>,
  sizes: ReadonlySet<string>,
): number | undefined {
  for (const value of colors) {
    const wanted = new Set([value]);
    const match = (options ?? []).find(
      (option) =>
        option.colorId != null &&
        matchesOption(wanted, option.colorId, option.colorName) &&
        (sizes.size === 0 || matchesOption(sizes, option.sizeId, option.sizeName)),
    );
    if (match?.colorId != null) return match.colorId;
  }

  return undefined;
}

/**
 * A card shows one color of a product that comes in several. When the shopper filters by color,
 * the card has to show that color (photo, price, stock, link), not the product's default one.
 */
export function pickColorView(
  product: CatalogProduct,
  colors: ReadonlySet<string>,
  sizes: ReadonlySet<string>,
): CatalogProduct {
  if (colors.size === 0 || !product.colorViews) return product;

  const colorId = findMatchingColorId(product.variantOptions, colors, sizes);
  const view = colorId != null ? product.colorViews[colorId] : undefined;
  return view ? { ...product, ...view } : product;
}
