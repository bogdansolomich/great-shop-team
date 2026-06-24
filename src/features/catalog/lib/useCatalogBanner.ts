'use client';

import { useMemo } from 'react';

import { getCatalogBannerImageSrc } from '@/features/catalog/lib/catalogBanner';
import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import { useTranslation } from '@/i18n/useTranslation';

export function useCatalogBanner(category: CatalogCategory) {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      image: {
        src: getCatalogBannerImageSrc(category),
        alt: t.catalog.categories[category].bannerImageAlt,
      },
      title: t.catalog.categories[category].bannerTitle,
      description: t.catalog.categories[category].bannerDescription,
      shopNowLabel: t.landing.shopNow,
    }),
    [category, t],
  );
}
