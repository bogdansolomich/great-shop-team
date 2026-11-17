'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { CatalogScope } from '@/features/catalog/model/catalogCategory';
import { isFragranceSubcategory } from '@/features/catalog/model/catalogCategory';
import {
  isCatalogSortOption,
  parseCsvParam,
  parseGenderParams,
  parseGroupParams,
  parsePriceParam,
  toCsvParam,
  type CatalogListingFilters,
} from '@/features/catalog/model/catalogFilters';
import { useCatalogListing } from '@/features/catalog/lib/useCatalogListing';
import { CATALOG_PAGE_SIZE } from '@/features/catalog/config/catalogPagination';
import CatalogBanner from '@/features/catalog/ui/CatalogBanner/CatalogBanner';
import CatalogBreadcrumbs from '@/features/catalog/ui/CatalogBreadcrumbs/CatalogBreadcrumbs';
import CatalogFilterPanel from '@/features/catalog/ui/CatalogFilter/CatalogFilterPanel';
import CatalogLoadMore from '@/features/catalog/ui/CatalogLoadMore/CatalogLoadMore';
import CatalogProductGrid from '@/features/catalog/ui/CatalogProductGrid/CatalogProductGrid';
import CatalogToolbar from '@/features/catalog/ui/CatalogToolbar/CatalogToolbar';
import { catalogPage } from '@/features/catalog/ui/catalogClasses';
import { useTranslation } from '@/i18n/useTranslation';

type CatalogPageProps = {
  category: CatalogScope;
};

export default function CatalogPage({ category }: CatalogPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);

  const filters = useMemo<CatalogListingFilters>(() => {
    const sortParam = searchParams.get('sort');
    return {
      q: searchParams.get('q')?.trim() || undefined,
      subcategory: parseCsvParam(searchParams.get('subcategory')),
      type: searchParams.get('type') ?? undefined,
      gender: parseGenderParams(searchParams.get('gender')),
      group: parseGroupParams(searchParams.get('group')),
      brand: parseCsvParam(searchParams.get('brand')),
      color: parseCsvParam(searchParams.get('color')),
      size: parseCsvParam(searchParams.get('size')),
      minPrice: parsePriceParam(searchParams.get('minPrice')),
      maxPrice: parsePriceParam(searchParams.get('maxPrice')),
      sort: isCatalogSortOption(sortParam) ? sortParam : 'featured',
    };
  }, [searchParams]);

  const { products, facets, isLoading, isError } = useCatalogListing(category, filters);

  const filterKey = [
    category,
    filters.q,
    (filters.subcategory ?? []).join(','),
    filters.type,
    (filters.gender ?? []).join(','),
    (filters.group ?? []).join(','),
    (filters.brand ?? []).join(','),
    (filters.color ?? []).join(','),
    (filters.size ?? []).join(','),
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
  ].join('|');

  const [paginationKey, setPaginationKey] = useState(filterKey);
  if (paginationKey !== filterKey) {
    setPaginationKey(filterKey);
    setVisibleCount(CATALOG_PAGE_SIZE);
  }

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Every filter group with at least one selected value counts once. Nothing selected = no filter.
  const hasValues = (selected: unknown[] | undefined) => (selected?.length ?? 0) > 0;

  const activeFilterCount =
    Number(hasValues(filters.brand)) +
    Number(hasValues(filters.color)) +
    Number(hasValues(filters.size)) +
    Number(hasValues(filters.subcategory)) +
    Number(hasValues(filters.group)) +
    // Picking both genders restricts nothing (see useCatalogListing).
    Number(filters.gender?.length === 1) +
    Number(Boolean(filters.type)) +
    Number(filters.minPrice !== undefined || filters.maxPrice !== undefined);

  const bannerCategory: CatalogScope =
    category === 'fragrances' ||
    (filters.subcategory ?? []).some((item) => isFragranceSubcategory(item))
      ? 'fragrances'
      : category;

  const breadcrumbs = useMemo(() => {
    const home = { href: '/', label: t.common.home };
    const all = { label: t.catalog.breadcrumbAll, current: true };

    if (bannerCategory === 'all') {
      return [home, { href: '/catalog', label: t.catalog.title }, all];
    }

    const categoryLabel = t.catalog.categories[bannerCategory].navLabel;
    const categoryHref = `/catalog/${bannerCategory}`;
    const selectedSubcategories = filters.subcategory ?? [];
    const subcategory =
      selectedSubcategories.length === 1
        ? facets.subcategories.find(
            (item) =>
              item.slug === selectedSubcategories[0] ||
              String(item.id) === selectedSubcategories[0],
          )
        : undefined;

    if (subcategory) {
      return [
        home,
        { href: categoryHref, label: categoryLabel },
        { label: subcategory.name, current: true },
      ];
    }

    return [home, { href: categoryHref, label: categoryLabel }, all];
  }, [
    bannerCategory,
    facets.subcategories,
    filters.subcategory,
    t.catalog.breadcrumbAll,
    t.catalog.categories,
    t.catalog.title,
    t.common.home,
  ]);

  return (
    <div className="mb-12 md:mb-20">
      <CatalogBanner category={bannerCategory} />

      <div className={catalogPage.breadcrumbs}>
        <CatalogBreadcrumbs items={breadcrumbs} />
      </div>

      <div id="catalog-products" className={catalogPage.content}>
        <CatalogToolbar
          stylesCount={products.length}
          onFilterClick={() => setIsFilterOpen(true)}
          sort={filters.sort ?? 'featured'}
          onSortChange={(sort) => updateParams({ sort: sort === 'featured' ? undefined : sort })}
          activeFilterCount={activeFilterCount}
        />

        {isLoading ? (
          <p className="py-16 text-center text-dark/60">{t.common.loading}</p>
        ) : isError ? (
          <p className="py-16 text-center text-dark/60">{t.catalog.loadError}</p>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-dark/60">{t.catalog.empty}</p>
        ) : (
          <>
            <CatalogProductGrid products={visibleProducts} />
            <CatalogLoadMore
              viewed={visibleProducts.length}
              total={products.length}
              onClick={
                hasMore
                  ? () =>
                      setVisibleCount((count) =>
                        Math.min(count + CATALOG_PAGE_SIZE, products.length),
                      )
                  : undefined
              }
            />
          </>
        )}
      </div>

      <CatalogFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        groups={facets.groups}
        sizes={facets.sizes}
        sizeKind={facets.sizeKind}
        colors={facets.colors}
        brands={facets.brands}
        selectedBrands={filters.brand ?? []}
        selectedColors={filters.color ?? []}
        selectedSizes={filters.size ?? []}
        selectedSubcategories={filters.subcategory ?? []}
        selectedGenders={filters.gender ?? []}
        selectedGroups={filters.group ?? []}
        selectedMinPrice={filters.minPrice}
        selectedMaxPrice={filters.maxPrice}
        onApply={(next) =>
          updateParams({
            gender: toCsvParam(next.gender),
            subcategory: toCsvParam(next.subcategory),
            group: toCsvParam(next.group),
            size: toCsvParam(next.size),
            color: toCsvParam(next.color),
            brand: toCsvParam(next.brand),
            minPrice: next.minPrice.trim() ? String(Number(next.minPrice)) : undefined,
            maxPrice: next.maxPrice.trim() ? String(Number(next.maxPrice)) : undefined,
          })
        }
        // Drops every filter, including the ones that arrive from menu links (subcategory, type).
        // The search query and the sort order are not filters and stay as they are.
        onClear={() =>
          updateParams({
            gender: undefined,
            subcategory: undefined,
            type: undefined,
            group: undefined,
            size: undefined,
            color: undefined,
            brand: undefined,
            minPrice: undefined,
            maxPrice: undefined,
          })
        }
      />
    </div>
  );
}
