'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  formatLocalizedPrice,
  pickMainImageUrl,
  resolveVariantPrice,
} from '@/features/catalog/lib/resolveVariantOffer';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetBrandsQuery } from '@/store/endpoints/brandsEndpoints';
import {
  useGetCurrenciesQuery,
  useGetProductImagesQuery,
  useGetProductVariantsQuery,
} from '@/store/endpoints/catalogMetaEndpoints';
import { useGetAdminOrdersQuery, useGetAdminProductsQuery } from '@/store/endpoints/adminEndpoints';
import AdminPagination, { ADMIN_PAGE_SIZE } from './AdminPagination';

const MONTHS = {
  uk: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

const CANCELLED_STATUSES = new Set(['CANCELLED', 'CANCELED']);

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const distance = point.x - previous.x;
    return `${path} C ${previous.x + distance / 3} ${previous.y}, ${
      point.x - distance / 3
    } ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

export default function AdminOverview() {
  const { t, locale } = useTranslation();
  const [popularPage, setPopularPage] = useState(1);
  const products = useGetAdminProductsQuery();
  const variants = useGetProductVariantsQuery();
  const images = useGetProductImagesQuery();
  const currencies = useGetCurrenciesQuery();
  const brands = useGetBrandsQuery();
  const orders = useGetAdminOrdersQuery();
  const months = locale === 'uk' ? MONTHS.uk : MONTHS.en;
  const currency = locale === 'uk' ? 'UAH' : 'USD';
  const allOrders = orders.data ?? [];
  const validOrders = allOrders.filter(
    (order) => !CANCELLED_STATUSES.has(order.status.toUpperCase()),
  );
  const revenueOrders = validOrders.filter(
    (order) => order.currency_code.toUpperCase() === currency,
  );
  const totalRevenue = revenueOrders.reduce((sum, order) => {
    const amount = Number(order.total_amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
  const customerCount = new Set(
    validOrders
      .map((order) => order.customer_email || order.email || order.user?.email)
      .filter((email): email is string => Boolean(email?.trim()))
      .map((email) => email.trim().toLowerCase()),
  ).size;
  const activeProducts = (products.data ?? []).filter(
    (product) => product.is_active && !product.is_hidden,
  ).length;
  const pendingOrders = validOrders.filter(
    (order) => order.status.toUpperCase() === 'PENDING',
  ).length;
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 12 }, (_, month) =>
    revenueOrders.reduce((sum, order) => {
      const createdAt = new Date(order.created_at);
      const amount = Number(order.total_amount);
      return createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === month &&
        Number.isFinite(amount)
        ? sum + amount
        : sum;
    }, 0),
  );
  const maxMonthlyRevenue = Math.max(...monthlyRevenue, 1);
  const chartPoints = monthlyRevenue.map((amount, index) => ({
    x: 24 + (index * 952) / 11,
    y: 166 - (amount / maxMonthlyRevenue) * 126,
  }));
  const revenueLine = smoothPath(chartPoints);
  const revenueArea = `${revenueLine} L 976 184 L 24 184 Z`;
  const thisMonthRevenue = monthlyRevenue[now.getMonth()];
  const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const previousMonthRevenue =
    now.getMonth() === 0
      ? revenueOrders.reduce((sum, order) => {
          const createdAt = new Date(order.created_at);
          const amount = Number(order.total_amount);
          return createdAt.getFullYear() === now.getFullYear() - 1 &&
            createdAt.getMonth() === previousMonth &&
            Number.isFinite(amount)
            ? sum + amount
            : sum;
        }, 0)
      : monthlyRevenue[previousMonth];
  const revenueChange =
    previousMonthRevenue > 0
      ? ((thisMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : null;
  const variantById = new Map((variants.data ?? []).map((variant) => [variant.id, variant]));
  const brandNameById = new Map((brands.data ?? []).map((brand) => [brand.id, brand.name]));
  const salesByProduct = new Map<number, number>();
  const stockByProduct = new Map<number, number>();

  for (const variant of variants.data ?? []) {
    stockByProduct.set(
      variant.product,
      (stockByProduct.get(variant.product) ?? 0) + (Number(variant.stock) || 0),
    );
  }
  for (const order of validOrders) {
    for (const item of order.items) {
      const variant =
        item.product_variant == null ? undefined : variantById.get(item.product_variant);
      if (!variant) continue;
      salesByProduct.set(
        variant.product,
        (salesByProduct.get(variant.product) ?? 0) + item.quantity,
      );
    }
  }

  const popular = [...(products.data ?? [])]
    .map((product) => {
      const productVariants = (variants.data ?? []).filter(
        (variant) => variant.product === product.id && variant.is_active !== false,
      );
      const variantIds = new Set(productVariants.map((variant) => variant.id));
      const productImages = (images.data ?? []).filter((image) =>
        variantIds.has(image.product_variant),
      );
      const image = pickMainImageUrl(productImages);
      const price = resolveVariantPrice({
        variants: productVariants,
        currencies: currencies.data,
        preferredCurrency: currency,
      });
      return {
        ...product,
        image,
        price,
        sales: salesByProduct.get(product.id) ?? 0,
        stock: stockByProduct.get(product.id) ?? 0,
        sku: productVariants[0]?.sku,
        brandName: brandNameById.get(product.brand),
      };
    })
    .sort((left, right) => right.sales - left.sales || right.id - left.id);
  const totalPopularPages = Math.ceil(popular.length / ADMIN_PAGE_SIZE);
  const currentPopularPage = Math.min(popularPage, Math.max(totalPopularPages, 1));
  const visiblePopular = popular.slice(
    (currentPopularPage - 1) * ADMIN_PAGE_SIZE,
    currentPopularPage * ADMIN_PAGE_SIZE,
  );
  const isProductsLoading =
    products.isLoading ||
    variants.isLoading ||
    images.isLoading ||
    currencies.isLoading ||
    brands.isLoading ||
    orders.isLoading;
  const hasProductsError =
    products.isError ||
    variants.isError ||
    images.isError ||
    currencies.isError ||
    brands.isError ||
    orders.isError;
  const isDashboardLoading =
    products.isLoading ||
    orders.isLoading ||
    variants.isLoading ||
    images.isLoading ||
    currencies.isLoading ||
    brands.isLoading;
  const hasDashboardError =
    products.isError ||
    orders.isError ||
    variants.isError ||
    images.isError ||
    currencies.isError ||
    brands.isError;
  const revenueTrend =
    revenueChange === null
      ? ''
      : ` · ${revenueChange >= 0 ? '↗' : '↘'} ${Math.abs(revenueChange).toFixed(1)}% ${t.admin.vsLastMonth}`;
  const revenueDetail = `${t.admin.thisMonth}: ${formatLocalizedPrice(
    thisMonthRevenue,
    currency,
    locale,
  )}${revenueTrend}`;
  const stats = [
    {
      key: 'revenue',
      label: t.admin.revenue,
      value: formatLocalizedPrice(totalRevenue, currency, locale),
      detail: revenueDetail,
      color: 'from-neutral-100 to-white',
      accent: '#111111',
    },
    {
      key: 'customers',
      label: t.admin.customers,
      value: customerCount.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US'),
      detail: t.admin.uniqueCustomers,
      color: 'from-neutral-50 to-white',
      accent: '#111111',
    },
    {
      key: 'transactions',
      label: t.admin.transactions,
      value: validOrders.length.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US'),
      detail: `${pendingOrders} ${t.admin.pendingOrders.toLowerCase()}`,
      color: 'from-neutral-100 to-white',
      accent: '#111111',
    },
    {
      key: 'totalProducts',
      label: t.admin.totalProducts,
      value: activeProducts.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-US'),
      detail: t.admin.activeProducts,
      color: 'from-neutral-50 to-white',
      accent: '#111111',
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 text-[26px] leading-tight font-bold">{t.admin.dashboard}</h1>
        <p className="m-0 text-sm text-[#9aa1ad]">{now.getFullYear()}</p>
      </div>

      {hasDashboardError ? (
        <p role="alert" className="m-0 rounded-xl bg-[#fff1f0] px-4 py-3 text-sm text-[#c0392b]">
          {t.admin.loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} px-5 py-4 shadow-[0_8px_24px_rgb(30_41_59/6%)]`}
          >
            <span
              className="absolute top-0 right-0 h-20 w-20 translate-x-5 -translate-y-6 rounded-full opacity-15"
              style={{ backgroundColor: stat.accent }}
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#596273]">
                <span>{stat.label}</span>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: stat.accent }} />
              </div>
              <p className="m-0 mt-5 truncate text-[28px] leading-none font-bold tracking-tight text-[#1d2433]">
                {isDashboardLoading || hasDashboardError ? '—' : stat.value}
              </p>
              <p className="m-0 mt-3 truncate text-xs text-[#737d8e]">
                {isDashboardLoading ? t.common.loading : stat.detail}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl bg-white px-5 py-4 shadow-[0_8px_24px_rgb(30_41_59/6%)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-base font-bold">{t.admin.salesYear}</h2>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-black">
              {formatLocalizedPrice(thisMonthRevenue, currency, locale)} · {months[now.getMonth()]}
            </span>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm text-[#6b7280] no-underline"
            >
              {t.admin.showAll} <NorthEastIcon />
            </Link>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2 text-xs text-[#6b7280]">
          <span className="size-2.5 rounded-sm bg-black" />
          {t.admin.revenue} · {currency}
        </div>
        {orders.isLoading ? (
          <p className="m-0 py-12 text-center text-sm text-[#9aa1ad]">{t.common.loading}</p>
        ) : orders.isError ? (
          <p className="m-0 py-12 text-center text-sm text-[#c0392b]">{t.admin.loadError}</p>
        ) : (
          <div className="relative">
            {!monthlyRevenue.some((amount) => amount > 0) ? (
              <p className="absolute inset-0 z-10 m-0 flex items-center justify-center text-sm text-[#9aa1ad]">
                {t.admin.noRevenueData}
              </p>
            ) : null}
            <svg
              viewBox="0 0 1000 200"
              className="h-52 w-full overflow-visible"
              role="img"
              aria-label={t.admin.revenue}
            >
              <defs>
                <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#111111" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[40, 82, 124, 166].map((y) => (
                <line
                  key={y}
                  x1="24"
                  x2="976"
                  y1={y}
                  y2={y}
                  stroke="#edf0f5"
                  strokeDasharray="3 7"
                />
              ))}
              <path d={revenueArea} fill="url(#revenue-fill)" />
              <path
                d={revenueLine}
                fill="none"
                stroke="#111111"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {chartPoints.map((point, index) => (
                <g key={months[index]}>
                  <title>
                    {months[index]}: {formatLocalizedPrice(monthlyRevenue[index], currency, locale)}
                  </title>
                  {index === now.getMonth() ? (
                    <circle cx={point.x} cy={point.y} r="9" fill="#111111" opacity="0.1" />
                  ) : null}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={index === now.getMonth() ? 4.5 : 3}
                    fill="white"
                    stroke="#111111"
                    strokeWidth="2"
                  />
                </g>
              ))}
            </svg>
            <div className="grid grid-cols-6 border-t border-[#edf0f5] px-1 sm:grid-cols-12">
              {monthlyRevenue.map((_, index) => {
                return (
                  <span
                    key={months[index]}
                    className={`pt-2 text-center text-[10px] sm:text-[11px] ${index === now.getMonth() ? 'font-semibold text-black' : 'text-[#9aa1ad]'}`}
                  >
                    {months[index]}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white px-5 py-4 shadow-[0_8px_24px_rgb(30_41_59/6%)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-bold">{t.admin.popular}</h2>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-sm text-[#6b7280] no-underline"
          >
            {t.admin.showAll} <NorthEastIcon />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs text-[#484a4e]">
                <th className="w-16 px-3 py-3 font-semibold">{t.admin.photo}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.name}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.stock}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.price}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.salesCount}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.brands}</th>
                <th className="px-5 py-3 font-semibold">{t.admin.status}</th>
              </tr>
            </thead>
            <tbody>
              {isProductsLoading ? (
                <tr>
                  <td className="px-5 py-6 text-[#9aa1ad]" colSpan={7}>
                    {t.common.loading}
                  </td>
                </tr>
              ) : null}
              {hasProductsError ? (
                <tr>
                  <td className="px-5 py-6 text-[#9aa1ad]" colSpan={7}>
                    {t.admin.loadError}
                  </td>
                </tr>
              ) : null}
              {!isProductsLoading && !hasProductsError && popular.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#9aa1ad]" colSpan={7}>
                    {t.admin.empty}
                  </td>
                </tr>
              ) : null}
              {visiblePopular.map((product) => {
                const productName =
                  (locale === 'uk' ? product.name_uk : product.name_en) || product.name;
                const status = product.is_hidden
                  ? t.admin.hidden
                  : product.is_active
                    ? t.admin.active
                    : t.admin.inactive;
                const statusClass = product.is_hidden
                  ? 'bg-[#f3f4f6] text-[#6b7280]'
                  : product.is_active === false
                    ? 'bg-[#fff1f0] text-[#ef4444]'
                    : 'bg-[#e8f7ee] text-[#178a45]';
                return (
                  <tr key={product.id} className="border-t border-[#f3f4f6]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="size-12 rounded-xl object-cover"
                          />
                        ) : (
                          <img
                            src={
                              locale === 'uk'
                                ? '/images/catalog/photo-placeholder-uk.svg'
                                : '/images/catalog/photo-placeholder-en.svg'
                            }
                            alt=""
                            className="size-12 rounded-xl bg-[#f3f4f6] object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-[#1d2433] no-underline"
                      >
                        {productName}
                      </Link>
                      <span className="mt-1 block text-xs text-[#9aa1ad]">
                        SKU: {product.product_code || product.sku || product.id}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">{product.stock}</td>
                    <td className="px-5 py-4">
                      {product.price
                        ? formatLocalizedPrice(product.price.amount, product.price.currency, locale)
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-[#6b7280]">{product.sales}</td>
                    <td className="px-5 py-4">{product.brandName ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isProductsLoading && !hasProductsError && popular.length > 0 ? (
          <AdminPagination
            page={currentPopularPage}
            pageSize={ADMIN_PAGE_SIZE}
            totalItems={popular.length}
            onPageChange={setPopularPage}
          />
        ) : null}
      </section>
    </div>
  );
}

function NorthEastIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14 14 6M8 6h6v6" />
    </svg>
  );
}
