import { CATALOG_GROUPS, type CatalogProductGroup } from '@/features/catalog/model/catalogCategory';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import type { Brand, CatalogColor, CatalogSize } from '@/store/types';

/** A filter that offers fewer options than this cannot narrow anything down, so it is hidden. */
const MIN_FACET_OPTIONS = 2;

/**
 * Options offered by the filter panel for one catalog category.
 * An empty list means the filter does not apply to that category and must not be shown.
 */
export type CatalogFacets = {
  /** Sections of the catalog to pick from. Only the "all products" page offers them. */
  groups: CatalogProductGroup[];
  brands: Brand[];
  colors: CatalogColor[];
  /** Sizes of a single size family (XS–XL, 36–44, 50–100 ml…); empty when sizes don't apply. */
  sizes: CatalogSize[];
  /** `size_type` of `sizes` (e.g. `perfume`); lets the panel label the filter. */
  sizeKind?: string;
};

type BuildCatalogFacetsArgs = {
  /** Products of the current category, before the shopper's own filters are applied. */
  products: CatalogProduct[];
  /** True on the page with every product; a single category has nothing to pick between. */
  offerGroups: boolean;
  brands: Brand[];
  colors: CatalogColor[];
  sizes: CatalogSize[];
};

function onlyIfChoice<T>(options: T[]): T[] {
  return options.length >= MIN_FACET_OPTIONS ? options : [];
}

/**
 * Builds the filter options from what the category really contains, so every category gets
 * its own set: brands that have products in it, the sizes and colors those products come in.
 * Perfume has no colors and "One Size" accessories have nothing to choose, so those filters
 * disappear on their own instead of being special-cased.
 */
export function buildCatalogFacets({
  products,
  offerGroups,
  brands,
  colors,
  sizes,
}: BuildCatalogFacetsArgs): CatalogFacets {
  const groupSet = new Set<CatalogProductGroup>();
  const brandIds = new Set<number>();
  const colorIds = new Set<number>();
  const sizeIds = new Set<number>();

  for (const product of products) {
    product.groups?.forEach((group) => groupSet.add(group));
    if (product.brandId != null) brandIds.add(Number(product.brandId));
    product.colorIds?.forEach((id) => colorIds.add(Number(id)));
    product.sizeIds?.forEach((id) => sizeIds.add(Number(id)));
  }

  const usedSizes = sizes
    .filter((size) => sizeIds.has(Number(size.id)))
    .sort((a, b) => a.sort_order - b.sort_order);

  // Sizes of different families (XS–XL next to 36–44 or 50 ml) are not comparable, so one
  // "Size" filter only makes sense for a category that uses a single family.
  const sizeKinds = new Set(usedSizes.map((size) => size.size_type));
  const comparableSizes = sizeKinds.size === 1 ? onlyIfChoice(usedSizes) : [];

  return {
    groups: offerGroups ? onlyIfChoice(CATALOG_GROUPS.filter((group) => groupSet.has(group))) : [],
    brands: onlyIfChoice(brands.filter((brand) => brandIds.has(Number(brand.id)))),
    colors: onlyIfChoice(colors.filter((color) => colorIds.has(Number(color.id)))),
    sizes: comparableSizes,
    sizeKind: comparableSizes[0]?.size_type,
  };
}
