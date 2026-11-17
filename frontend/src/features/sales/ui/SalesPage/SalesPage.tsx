'use client';

import Link from 'next/link';

import LandingProductCard from '@/features/landing/ui/sections/LandingProductCard/LandingProductCard';
import CatalogBreadcrumbs from '@/features/catalog/ui/CatalogBreadcrumbs/CatalogBreadcrumbs';
import { catalogGrid, catalogPage, catalogSection } from '@/features/catalog/ui/catalogClasses';
import { useSaleProducts, type SaleProduct } from '@/features/sales/lib/useSaleProducts';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetDiscountByIdQuery } from '@/store/endpoints/discountsEndpoints';

const SALES_BANNER_SRC = '/images/sales/Rectangle%2019267.png';

function SaleCard({ item, href }: { item: SaleProduct; href: string }) {
  const { t } = useTranslation();

  return (
    <LandingProductCard
      id={item.productId}
      href={href}
      image={item.image}
      title={item.title}
      price={item.price}
      compareAt={item.compareAt}
      badge={item.badge}
      ctaLabel={t.catalog.viewDetails}
      addToCartLine={item.cartLine}
    />
  );
}

export default function SalesPage() {
  const { t } = useTranslation();
  const { items, isLoading, isError } = useSaleProducts();

  return (
    <div className="mb-12 md:mb-20">
      <section
        className={catalogSection.banner}
        style={{ backgroundImage: `url("${SALES_BANNER_SRC}")` }}
        aria-label={t.salesPage.bannerImageAlt}
      >
        <div className={catalogSection.bannerContent}>
          <div className="flex w-full max-w-[600px] flex-col">
            <h1 className={`${catalogSection.bannerTitle} whitespace-pre-line`}>{t.salesPage.bannerTitle}</h1>
            <p className={catalogSection.bannerDescription}>{t.salesPage.bannerDescription}</p>
            <Link href="#sales-products" className="btn-primary">
              {t.landing.shopNow}
            </Link>
          </div>
        </div>
      </section>

      <div className={catalogPage.breadcrumbs}>
        <CatalogBreadcrumbs
          items={[
            { href: '/', label: t.common.home },
            { href: '/sales', label: t.salesPage.title },
            { label: t.catalog.breadcrumbAll, current: true },
          ]}
        />
      </div>

      <div id="sales-products" className={catalogPage.content}>
        {isLoading ? (
          <p className="py-16 text-center text-dark/60">{t.common.loading}</p>
        ) : isError ? (
          <p className="py-16 text-center text-dark/60">{t.salesPage.loadError}</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-dark/60">{t.salesPage.empty}</p>
        ) : (
          <div className={catalogGrid.root}>
            {items.map((item) => (
              <SaleCard key={item.discount.id} item={item} href={item.href} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SalesDiscountDetails({ id }: { id: string }) {
  const { t, locale } = useTranslation();
  const numericId = Number(id);
  const validId = Number.isInteger(numericId) && numericId > 0;
  const { resolve, isLoading, isError } = useSaleProducts();
  const discountQuery = useGetDiscountByIdQuery(numericId, { skip: !validId });

  if (!validId) {
    return <p className="py-10 text-base text-dark/60">{t.salesPage.notFound}</p>;
  }

  if (isLoading || discountQuery.isLoading) {
    return <p className="py-10 text-base text-dark/60">{t.common.loading}</p>;
  }

  if (isError || discountQuery.isError || !discountQuery.data) {
    return <p className="py-10 text-base text-dark/60">{t.salesPage.notFound}</p>;
  }

  const item = resolve(discountQuery.data);
  const end = new Date(discountQuery.data.end_at);
  const until = Number.isNaN(end.getTime())
    ? ''
    : new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-US', {
        dateStyle: 'medium',
      }).format(end);

  return (
    <section className="py-10 pb-20">
      <Link
        href="/sales"
        className="mb-6 inline-block text-sm text-gray no-underline hover:text-dark hover:underline"
      >
        {t.salesPage.back}
      </Link>
      {item ? (
        <>
          <h1 className="m-0 font-(family-name:--font-unbounded) text-[32px] font-semibold text-dark">
            {item.title}
          </h1>
          {until ? (
            <p className="mt-3 text-base text-dark/70">
              {t.salesPage.until.replace('{date}', until)}
            </p>
          ) : null}
          <div className="mt-10 max-w-[360px]">
            <SaleCard item={item} href={item.productHref} />
          </div>
        </>
      ) : (
        <p className="text-base text-dark/60">{t.salesPage.notFound}</p>
      )}
    </section>
  );
}
