'use client';

import { useMemo } from 'react';

import { landingHeroSlides, landingShopByItems } from '@/data/landingAssets';
import { useTranslation } from '@/i18n/useTranslation';

export function useLandingData() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      hero: {
        cta: t.landing.hero.cta,
        slidesAriaLabel: t.landing.hero.slidesAriaLabel,
        goToSlide: t.landing.hero.goToSlide,
        slides: landingHeroSlides.map((slide) => {
          const copy = t.landing.hero.slides[slide.id];
          return {
            id: slide.id,
            video: slide.video,
            href: slide.href,
            title: copy.title,
            description: copy.description,
          };
        }),
      },
      shopBy: landingShopByItems.map((item) => ({
        id: item.id,
        href: item.href,
        image: { src: item.image.src, alt: t.landing.shopByItems[item.id].imageAlt },
        label: t.landing.shopByItems[item.id].label,
      })),
      labels: {
        recentlyReleased: t.landing.recentlyReleased,
        shopAll: t.landing.shopAll,
        shopByCategory: t.landing.shopByCategory,
        prev: t.landing.prev,
        next: t.landing.next,
      },
    }),
    [t],
  );
}
