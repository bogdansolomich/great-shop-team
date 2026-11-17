'use client';

import { useEffect, useMemo } from 'react';

import {
  isFragranceSubcategory,
  isShoeSubcategory,
  resolveProductCatalogCategory,
  type CatalogScope,
} from '@/features/catalog/model/catalogCategory';
import {
  matchesVariantFilters,
  pickColorView,
  type CatalogListingFilters,
  type CatalogSortOption,
} from '@/features/catalog/model/catalogFilters';
import { buildCatalogFacets } from '@/features/catalog/model/catalogFacets';
import type { CatalogProduct } from '@/features/catalog/model/catalogProduct';
import { mapApiProductToCatalogCard } from '@/features/catalog/lib/mapApiProductToCatalogCard';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetBrandsQuery } from '@/store/endpoints/brandsEndpoints';
import {
  useGetCategoriesQuery,
  useGetSubcategoriesQuery,
} from '@/store/endpoints/categoriesEndpoints';
import {
  useGetColorsQuery,
  useGetCurrenciesQuery,
  useGetProductImagesQuery,
  useGetProductVariantsQuery,
  useGetSizesQuery,
} from '@/store/endpoints/catalogMetaEndpoints';
import { useGetProductsRawQuery } from '@/store/endpoints/productsEndpoints';
import { useGetDiscountsQuery } from '@/store/endpoints/discountsEndpoints';
import type { Brand, CatalogColor, CatalogSize, Subcategory } from '@/store/types';

function throttleRetryMs(error: unknown) {
  const detail = (error as { data?: { detail?: unknown } } | undefined)?.data?.detail;
  const seconds = Number(/in (\d+) second/i.exec(typeof detail === 'string' ? detail : '')?.[1]);
  if (Number.isFinite(seconds) && seconds > 0) return (seconds + 1) * 1000;
  return 4000;
}

function sortProducts(products: CatalogProduct[], sort: CatalogSortOption | undefined) {
  const next = [...products];

  switch (sort) {
    case 'price_asc':
      return next.sort(
        (a, b) =>
          (a.priceValue ?? Number.POSITIVE_INFINITY) - (b.priceValue ?? Number.POSITIVE_INFINITY),
      );
    case 'price_desc':
      return next.sort(
        (a, b) =>
          (b.priceValue ?? Number.NEGATIVE_INFINITY) - (a.priceValue ?? Number.NEGATIVE_INFINITY),
      );
    case 'newest':
      return next.sort((a, b) => Number(b.id) - Number(a.id));
    case 'bestsellers':
      return next.sort((a, b) => (b.stockTotal ?? 0) - (a.stockTotal ?? 0));
    case 'featured':
    default:
      return next;
  }
}

function categorySlugFor(categoryId: number | undefined, categoryIdBySlug: Map<string, number>) {
  if (categoryId == null) return undefined;
  for (const [slug, id] of categoryIdBySlug) {
    if (id === categoryId) return slug;
  }
  return undefined;
}

function isAccessorySubcategory(subcategory?: { slug?: string; name?: string }) {
  return /accessor/i.test(`${subcategory?.slug ?? ''} ${subcategory?.name ?? ''}`);
}

function isClothingSubcategory(subcategory?: { slug?: string; name?: string }) {
  return /cloth/i.test(`${subcategory?.slug ?? ''} ${subcategory?.name ?? ''}`);
}

function matchesRouteCategory(
  category: Exclude<CatalogScope, 'all'>,
  subcategory: Subcategory | undefined,
  categoryIdBySlug: Map<string, number>,
) {
  const parent = categorySlugFor(subcategory?.category, categoryIdBySlug);

  if (category === 'fragrances') {
    return parent === 'perfumes' || parent === 'fragrances' || isFragranceSubcategory(subcategory);
  }

  if (category === 'accessories') {
    return parent === 'accessories' || isAccessorySubcategory(subcategory);
  }

  if (category === 'shoes') {
    return parent === 'shoes' || isShoeSubcategory(subcategory);
  }

  if (category === 'men') {
    return parent === 'men' && isClothingSubcategory(subcategory);
  }

  if (category === 'women') {
    return parent === 'women' && isClothingSubcategory(subcategory);
  }

  return false;
}

export function useCatalogListing(category: CatalogScope, filters: CatalogListingFilters = {}) {
  const { locale } = useTranslation();

  const productsQuery = useGetProductsRawQuery();
  const brandsQuery = useGetBrandsQuery();
  const categoriesQuery = useGetCategoriesQuery();
  const subcategoriesQuery = useGetSubcategoriesQuery();
  const colorsQuery = useGetColorsQuery();
  const sizesQuery = useGetSizesQuery();
  const variantsQuery = useGetProductVariantsQuery();
  const imagesQuery = useGetProductImagesQuery();
  const currenciesQuery = useGetCurrenciesQuery();
  const discountsQuery = useGetDiscountsQuery();

  const offerQueries = [
    variantsQuery,
    imagesQuery,
    currenciesQuery,
    categoriesQuery,
    subcategoriesQuery,
  ];
  const retryQueries = [...offerQueries, brandsQuery, colorsQuery, sizesQuery, discountsQuery];
  const offersPending = offerQueries.some(
    (query) => query.isLoading || query.isUninitialized || (query.isFetching && query.data == null),
  );
  const offersFailed = offerQueries.some((query) => query.isError && query.data == null);
  const isLoading = productsQuery.isLoading || productsQuery.isUninitialized || offersPending;
  const isError = Boolean(productsQuery.isError) || offersFailed;

  useEffect(() => {
    const failed = retryQueries.filter((query) => query.isError && query.data == null);
    if (failed.length === 0) return undefined;

    const delay = Math.max(...failed.map((query) => throttleRetryMs(query.error)));
    const timer = window.setTimeout(() => {
      failed.forEach((query) => {
        void query.refetch();
      });
    }, delay);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch identities are stable; we only watch error/data
  }, [
    brandsQuery.isError,
    brandsQuery.error,
    brandsQuery.data,
    colorsQuery.isError,
    colorsQuery.error,
    colorsQuery.data,
    sizesQuery.isError,
    sizesQuery.error,
    sizesQuery.data,
    discountsQuery.isError,
    discountsQuery.error,
    discountsQuery.data,
    variantsQuery.isError,
    variantsQuery.error,
    variantsQuery.data,
    imagesQuery.isError,
    imagesQuery.error,
    imagesQuery.data,
    currenciesQuery.isError,
    currenciesQuery.error,
    currenciesQuery.data,
    categoriesQuery.isError,
    categoriesQuery.error,
    categoriesQuery.data,
    subcategoriesQuery.isError,
    subcategoriesQuery.error,
    subcategoriesQuery.data,
  ]);

  // Reference lists limited to what a shopper may see: active, not hidden, inside this category.
  const visibleReference = useMemo(() => {
    const brands = (brandsQuery.data ?? []).filter((item) => {
      const active = 'is_active' in item ? (item as { is_active?: boolean }).is_active : true;
      const hidden = 'is_hidden' in item ? (item as { is_hidden?: boolean }).is_hidden : false;
      return active !== false && !hidden;
    });

    const categories = categoriesQuery.data ?? [];
    const categoryIdBySlug = new Map(categories.map((item) => [item.slug, item.id]));

    const subcategories = (subcategoriesQuery.data ?? [])
      .filter((item) => {
        const active = 'is_active' in item ? (item as { is_active?: boolean }).is_active : true;
        const hidden = 'is_hidden' in item ? (item as { is_hidden?: boolean }).is_hidden : false;
        return active !== false && !hidden;
      })
      .filter((item) => {
        if (category === 'all') return true;
        return matchesRouteCategory(category, item, categoryIdBySlug);
      });

    const colors = (colorsQuery.data ?? []).filter((item) => {
      const active = 'is_active' in item ? (item as { is_active?: boolean }).is_active : true;
      return active !== false;
    });

    return { brands, subcategories, colors };
  }, [brandsQuery.data, categoriesQuery.data, subcategoriesQuery.data, colorsQuery.data, category]);

  const offersReady = offerQueries.every((query) => query.isSuccess);

  // Every product of this category as a card. The shopper's own filters are deliberately NOT
  // applied here: the filter panel is built from this list, so it only offers what the category has.
  const scopeProducts = useMemo(() => {
    if (!offersReady) return [];

    // Безопасная фильтрация продуктов (проверяет наличие полей is_active / is_hidden)
    const apiProducts = (productsQuery.data ?? []).filter((product) => {
      const p = product as unknown as { is_active?: boolean; is_hidden?: boolean };
      const isActive = p.is_active !== undefined ? p.is_active : true;
      const isHidden = p.is_hidden !== undefined ? p.is_hidden : false;
      return isActive && !isHidden;
    });

    const brandById = new Map<number, Brand>(
      (brandsQuery.data ?? []).map((brand) => [brand.id, brand]),
    );
    const subcategoryById = new Map<number, Subcategory>(
      (subcategoriesQuery.data ?? []).map((item) => [item.id, item]),
    );
    const colorsById = new Map<number, CatalogColor>(
      (colorsQuery.data ?? []).map((item) => [item.id, item]),
    );
    const sizesById = new Map<number, CatalogSize>(
      (sizesQuery.data ?? []).map((item) => [item.id, item]),
    );
    const categoryIdBySlug = new Map(
      (categoriesQuery.data ?? []).map((item) => [item.slug, item.id]),
    );
    const variants = variantsQuery.data ?? [];
    const images = imagesQuery.data ?? [];
    const currencies = currenciesQuery.data ?? [];
    const discounts = discountsQuery.data ?? [];

    const mapped = apiProducts
      .filter((product) => {
        if (category === 'all') return true;

        const subcategory = subcategoryById.get(Number(product.subcategory));
        return matchesRouteCategory(category, subcategory, categoryIdBySlug);
      })
      .map((product) => {
        const subcategory = subcategoryById.get(Number(product.subcategory));
        const productVariants = variants.filter(
          (variant) => Number(variant.product) === Number(product.id),
        );
        const genders = productVariants.map((variant) => variant.gender);
        const cardCategory =
          category === 'all'
            ? resolveProductCatalogCategory({
                productName: product.name,
                subcategoryCategoryId: subcategory?.category,
                subcategorySlug: subcategory?.slug,
                subcategoryName: subcategory?.name,
                categoryIdBySlug,
                genders,
              })
            : category;

        return mapApiProductToCatalogCard({
          product,
          category: cardCategory,
          locale,
          brandById,
          subcategoryById,
          variants,
          colorsById,
          sizesById,
          images,
          currencies,
          discounts,
        });
      });

    return mapped;
  }, [
    offersReady,
    productsQuery.data,
    brandsQuery.data,
    subcategoriesQuery.data,
    categoriesQuery.data,
    colorsQuery.data,
    sizesQuery.data,
    variantsQuery.data,
    imagesQuery.data,
    currenciesQuery.data,
    discountsQuery.data,
    category,
    locale,
  ]);

  // What the filter panel offers for this category. Nothing here depends on the applied filters,
  // so options never disappear while the shopper is picking them.
  const facets = useMemo(
    () => ({
      subcategories: visibleReference.subcategories,
      ...buildCatalogFacets({
        products: scopeProducts,
        offerGroups: category === 'all',
        brands: visibleReference.brands,
        colors: visibleReference.colors,
        sizes: sizesQuery.data ?? [],
      }),
    }),
    [scopeProducts, category, visibleReference, sizesQuery.data],
  );

  const products = useMemo(() => {
    const subcategoryById = new Map<number, Subcategory>(
      (subcategoriesQuery.data ?? []).map((item) => [item.id, item]),
    );
    const categorySlugById = new Map(
      (categoriesQuery.data ?? []).map((item) => [item.id, item.slug]),
    );

    const brandFilters = new Set(filters.brand ?? []);
    const colorFilters = new Set(filters.color ?? []);
    const sizeFilters = new Set(filters.size ?? []);
    const subcategoryFilters = new Set(filters.subcategory ?? []);
    const genderFilters = new Set(filters.gender ?? []);
    const groupFilters = new Set(filters.group ?? []);

    // Color and size must describe the same variant. The card then shows that color, so the price
    // filter and the sort below work with the price of the color the shopper asked for.
    const matchingProducts = scopeProducts
      .filter((product) => matchesVariantFilters(product.variantOptions, colorFilters, sizeFilters))
      .map((product) => pickColorView(product, colorFilters, sizeFilters));

    const filtered = matchingProducts.filter((product) => {
      if (filters.q) {
        const needle = filters.q.toLowerCase();
        const haystack = [product.title, product.description, product.brandName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (subcategoryFilters.size > 0) {
        const slug = product.subcategory;
        const id = product.subcategoryId != null ? String(product.subcategoryId) : undefined;
        const parentSlug =
          product.subcategoryId != null
            ? categorySlugById.get(
                subcategoryById.get(Number(product.subcategoryId))?.category ?? -1,
              )
            : undefined;
        const hit =
          (slug && subcategoryFilters.has(slug)) ||
          (id && subcategoryFilters.has(id)) ||
          (parentSlug && subcategoryFilters.has(parentSlug));
        if (!hit) return false;
      }
      if (filters.type && product.type !== filters.type) return false;

      if (
        filters.minPrice !== undefined &&
        (product.priceValue === undefined || product.priceValue < filters.minPrice)
      ) {
        return false;
      }
      if (
        filters.maxPrice !== undefined &&
        (product.priceValue === undefined || product.priceValue > filters.maxPrice)
      ) {
        return false;
      }

      if (genderFilters.size > 0 && genderFilters.size < 2) {
        const genders = product.genders ?? [];
        const wantsMen = genderFilters.has('men');
        const wantsWomen = genderFilters.has('women');
        const matchesMen = genders.some((gender) => gender === 'male' || gender === 'unisex');
        const matchesWomen = genders.some((gender) => gender === 'female' || gender === 'unisex');
        if (genders.length > 0) {
          if (wantsMen && !wantsWomen && !matchesMen) return false;
          if (wantsWomen && !wantsMen && !matchesWomen) return false;
        }
      }

      if (groupFilters.size > 0 && !(product.groups ?? []).some((g) => groupFilters.has(g))) {
        return false;
      }

      if (brandFilters.size > 0) {
        const brandKey = product.brandId != null ? String(product.brandId) : product.brandName;
        if (!brandKey || !brandFilters.has(brandKey)) return false;
      }

      return true;
    });

    return sortProducts(filtered, filters.sort);
  }, [
    scopeProducts,
    subcategoriesQuery.data,
    categoriesQuery.data,
    filters.q,
    filters.subcategory,
    filters.type,
    filters.gender,
    filters.group,
    filters.brand,
    filters.color,
    filters.size,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
  ]);

  return {
    products,
    facets,
    isLoading,
    isError,
    isFetching: productsQuery.isFetching,
  };
}
