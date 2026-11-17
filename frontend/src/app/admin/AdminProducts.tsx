'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { buildProductHref } from '@/features/catalog/lib/buildProductHref';
import { formatLocalizedPrice } from '@/features/catalog/lib/resolveVariantOffer';
import { resolveProductCatalogCategory } from '@/features/catalog/model/catalogCategory';
import { discountBadge, isDiscountCurrent } from '@/features/sales/lib/saleOffer';
import { useTranslation } from '@/i18n/useTranslation';
import { toImageUrl } from '@/store/api/mappers/products.mapper';
import { useGetBrandsQuery } from '@/store/endpoints/brandsEndpoints';
import {
  useGetCurrenciesQuery,
  useGetProductImagesQuery,
  useGetProductVariantsQuery,
} from '@/store/endpoints/catalogMetaEndpoints';
import {
  useDeleteAdminProductMutation,
  useGetAdminCategoriesQuery,
  useGetAdminProductsQuery,
  useGetAdminSubcategoriesQuery,
} from '@/store/endpoints/adminEndpoints';
import { useGetDiscountsQuery } from '@/store/endpoints/discountsEndpoints';
import type { ApiProduct } from '@/store/types';

import { adminButton, adminButtonDanger } from './adminClasses';
import { formErrorText } from './formError';
import AdminPagination, { ADMIN_PAGE_SIZE } from './AdminPagination';

export default function AdminProducts() {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [removedProductIds, setRemovedProductIds] = useState<number[]>([]);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [openActions, setOpenActions] = useState<number | null>(null);
  const products = useGetAdminProductsQuery();
  const [deleteProduct] = useDeleteAdminProductMutation();
  const brands = useGetBrandsQuery();
  const variants = useGetProductVariantsQuery();
  const currencies = useGetCurrenciesQuery();
  const images = useGetProductImagesQuery();
  const subcategories = useGetAdminSubcategoriesQuery();
  const categories = useGetAdminCategoriesQuery();
  const { data: discountData, isError: discountsError } = useGetDiscountsQuery();

  const brandName = useMemo(
    () => new Map((brands.data ?? []).map((brand) => [brand.id, brand.name])),
    [brands.data],
  );
  const subcategoryName = useMemo(() => {
    const categoryNameById = new Map(
      (categories.data ?? []).map((category) => [
        category.id,
        locale === 'uk' ? category.name_uk || category.name : category.name_en || category.name,
      ]),
    );
    return new Map(
      (subcategories.data ?? []).map((item) => {
        const name = locale === 'uk' ? item.name_uk || item.name : item.name_en || item.name;
        const parentName = item.category ? categoryNameById.get(item.category) : undefined;
        return [item.id, parentName ? `${parentName} — ${name}` : name] as const;
      }),
    );
  }, [categories.data, locale, subcategories.data]);
  const categoryIdBySlug = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.slug, category.id])),
    [categories.data],
  );
  const subcategoryById = useMemo(
    () => new Map((subcategories.data ?? []).map((subcategory) => [subcategory.id, subcategory])),
    [subcategories.data],
  );
  const productExtras = useMemo(() => {
    const variantProduct = new Map<number, number>();
    const stock = new Map<number, number>();
    for (const variant of variants.data ?? []) {
      variantProduct.set(variant.id, variant.product);
      stock.set(variant.product, (stock.get(variant.product) ?? 0) + (Number(variant.stock) || 0));
    }
    const prices = new Map<number, Map<string, number>>();
    for (const currency of currencies.data ?? []) {
      const productId = variantProduct.get(currency.product_variant);
      const amount = Number(currency.amount);
      if (!productId || !Number.isFinite(amount)) continue;
      const productPrices = prices.get(productId) ?? new Map<string, number>();
      const current = productPrices.get(currency.currency_code);
      if (current === undefined || amount < current) {
        productPrices.set(currency.currency_code, amount);
      }
      prices.set(productId, productPrices);
    }
    const photo = new Map<number, { src: string; main: boolean; order: number }>();
    for (const image of images.data ?? []) {
      const productId = variantProduct.get(image.product_variant);
      if (!productId || !image.image) continue;
      const next = {
        src: toImageUrl(image.image),
        main: Boolean(image.is_main),
        order: image.sort_order ?? 0,
      };
      const current = photo.get(productId);
      const better =
        !current ||
        (next.main && !current.main) ||
        (next.main === current.main && next.order < current.order);
      if (better) photo.set(productId, next);
    }
    return { stock, prices, photo };
  }, [currencies.data, images.data, variants.data]);
  const promotionByProduct = useMemo(() => {
    const productByVariant = new Map(
      (variants.data ?? []).map((variant) => [variant.id, variant.product]),
    );
    const promotions = new Map<number, typeof discountData>();
    for (const discount of discountData ?? []) {
      const productId = productByVariant.get(discount.product_variant);
      if (!productId) continue;
      promotions.set(productId, [...(promotions.get(productId) ?? []), discount]);
    }
    return promotions;
  }, [discountData, variants.data]);

  function formatPrice(amount: number, currency: string) {
    return formatLocalizedPrice(amount, currency, locale, { maximumFractionDigits: 2 });
  }

  const filtered = (products.data ?? []).filter((product) => {
    if (product.is_hidden || removedProductIds.includes(product.id)) return false;
    const haystack =
      `${product.name} ${product.name_uk ?? ''} ${product.name_en ?? ''} ${product.slug}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedProducts = filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  const selectedIds = new Set(selected);
  const allSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((product) => selectedIds.has(product.id));

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    const pageIds = new Set(paginatedProducts.map((product) => product.id));
    setSelected((current) =>
      allSelected
        ? current.filter((id) => !pageIds.has(id))
        : [...new Set([...current, ...pageIds])],
    );
  }

  async function deleteProducts(list: ApiProduct[]) {
    setActing(true);
    setError('');
    setOpenActions(null);
    try {
      const results = await Promise.allSettled(
        list.map((product) => deleteProduct(product.id).unwrap()),
      );
      const removedIds = list
        .filter((_product, index) => results[index].status === 'fulfilled')
        .map((product) => product.id);
      const rejected = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      if (removedIds.length) {
        setRemovedProductIds((current) => [...new Set([...current, ...removedIds])]);
        setSelected((current) => current.filter((id) => !removedIds.includes(id)));
      }
      if (rejected) setError(formErrorText(rejected.reason, t.admin.saveError));
    } finally {
      setActing(false);
    }
  }

  async function deleteSelected() {
    const chosen = (products.data ?? []).filter((product) => selectedIds.has(product.id));
    await deleteProducts(chosen);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[28px] leading-tight font-bold">{t.admin.products}</h1>
          <p className="m-0 mt-1 text-sm text-[#9aa1ad]">{t.admin.productsPending}</p>
        </div>
        <Link
          href="/admin/products/new"
          className={adminButton}
        >
          <PlusIcon />
          {t.admin.addProduct}
        </Link>
      </div>
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgb(30_41_59/6%)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#f0f2f6] px-5 py-4">
          <div className="flex items-center gap-2">
            {selected.length > 0 ? (
              <>
                <button
                  type="button"
                  disabled={acting}
                  onClick={deleteSelected}
                  className={adminButtonDanger}
                >
                  {t.admin.delete}
                </button>
              </>
            ) : null}
            {error ? <p className="m-0 text-sm text-[#ef4444]">{error}</p> : null}
          </div>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.admin.search}
            aria-label={t.admin.search}
            className="h-11 w-full max-w-xs rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 text-sm outline-none focus:border-black focus:bg-white"
          />
        </div>
        {products.isLoading ? (
          <p className="m-0 px-5 py-6 text-sm text-[#6b7280]">{t.common.loading}</p>
        ) : null}
        {products.isError ? (
          <p className="m-0 px-5 py-6 text-sm text-[#ef4444]">{t.admin.loadError}</p>
        ) : null}
        {!products.isLoading && !products.isError && filtered.length === 0 ? (
          <p className="m-0 px-5 py-6 text-sm text-[#6b7280]">{t.admin.empty}</p>
        ) : null}
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-[#484a4e] uppercase">
                  <th className="w-12 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={t.admin.selectAll}
                      className="size-4 cursor-pointer accent-black"
                    />
                  </th>
                  <th className="w-16 px-3 py-3 font-semibold">{t.admin.photo}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.name}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.stock}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.price}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.promotionColumn}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.slug}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.brands}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.subcategories}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.status}</th>
                  <th className="px-5 py-3 font-semibold">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const prices = productExtras.prices.get(product.id);
                  const displayCurrency = locale === 'uk' ? 'UAH' : 'USD';
                  const displayPrice = prices?.get(displayCurrency);
                  const productDiscounts = promotionByProduct.get(product.id) ?? [];
                  const activeDiscounts = productDiscounts.filter((discount) =>
                    isDiscountCurrent(discount),
                  );
                  const scheduledDiscounts = productDiscounts.filter(
                    (discount) =>
                      discount.is_active &&
                      Number.isFinite(Date.parse(discount.start_at)) &&
                      Date.parse(discount.start_at) > Date.now(),
                  );
                  const promotionLabels = [
                    ...new Set(
                      activeDiscounts.map((discount) =>
                        discountBadge(discount, locale, displayCurrency),
                      ),
                    ),
                  ];
                  const status = product.is_hidden
                    ? t.admin.hidden
                    : product.is_active === false
                      ? t.admin.inactive
                      : t.admin.active;
                  const statusClass = product.is_hidden
                    ? 'bg-[#f3f4f6] text-[#6b7280]'
                    : product.is_active === false
                      ? 'bg-[#fff1f0] text-[#ef4444]'
                      : 'bg-[#e8f7ee] text-[#178a45]';
                  return (
                    <tr
                      key={product.id}
                      className={`border-t border-[#f3f4f6] ${selectedIds.has(product.id) ? 'bg-[#f5f8ff]' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggle(product.id)}
                          aria-label={product.name}
                          className="size-4 cursor-pointer accent-black"
                        />
                      </td>
                      <td className="px-3 py-3">
                        {productExtras.photo.get(product.id)?.src ? (
                          <img
                            src={productExtras.photo.get(product.id)?.src}
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
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-[#1d2433] no-underline"
                        >
                          {locale === 'uk'
                            ? product.name_uk || product.name || product.name_en
                            : product.name_en || product.name || product.name_uk}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {productExtras.stock.get(product.id) ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        {displayPrice === undefined
                          ? '—'
                          : formatPrice(displayPrice, displayCurrency)}
                      </td>
                      <td className="px-5 py-4">
                        {discountsError ? (
                          <span className="text-xs text-[#ef4444]">{t.admin.loadError}</span>
                        ) : activeDiscounts.length > 0 ? (
                          <span className="inline-flex rounded-full bg-[#fff1f0] px-2.5 py-1 text-xs font-semibold text-[#d83b48]">
                            {promotionLabels.slice(0, 2).join(', ')}
                            {promotionLabels.length > 2 ? ` +${promotionLabels.length - 2}` : ''}
                          </span>
                        ) : scheduledDiscounts.length > 0 ? (
                          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-black">
                            {t.admin.promotionScheduled}
                          </span>
                        ) : productDiscounts.length > 0 ? (
                          <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold text-[#6b7280]">
                            {t.admin.promotionInactive}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#6b7280]">{product.slug}</td>
                      <td className="px-5 py-4">{brandName.get(product.brand) ?? '—'}</td>
                      <td className="px-5 py-4">
                        {subcategoryName.get(product.subcategory) ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <RowActions
                          open={openActions === product.id}
                          onToggle={() =>
                            setOpenActions((current) =>
                              current === product.id ? null : product.id,
                            )
                          }
                          onClose={() => setOpenActions(null)}
                          editHref={`/admin/products/${product.id}`}
                          viewHref={buildProductHref(
                            resolveProductCatalogCategory({
                              productName: product.name,
                              subcategoryCategoryId: subcategoryById.get(product.subcategory)
                                ?.category,
                              subcategorySlug: subcategoryById.get(product.subcategory)?.slug,
                              subcategoryName: subcategoryById.get(product.subcategory)?.name,
                              categoryIdBySlug,
                              genders: (variants.data ?? [])
                                .filter((variant) => variant.product === product.id)
                                .map((variant) => variant.gender),
                            }),
                            product,
                          )}
                          disabled={acting}
                          onDelete={() => deleteProducts([product])}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {!products.isLoading && !products.isError && filtered.length > 0 ? (
          <AdminPagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" d="M10 4v12M4 10h12" />
    </svg>
  );
}

function RowActions({
  open,
  onToggle,
  onClose,
  editHref,
  viewHref,
  disabled,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  editHref: string;
  viewHref: string;
  disabled: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [place, setPlace] = useState({ top: 0, left: 0 });
  const itemClass =
    'block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-sm text-[#1d2433] no-underline hover:bg-[#f6f7fb]';

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && buttonRef.current?.parentElement?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [onClose, open]);

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPlace({ top: rect.bottom + 6, left: rect.right });
    onToggle();
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t.admin.actions}
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#e7eaf0] bg-white text-[#1d2433]"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open ? (
        <div
          className="fixed z-30 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_32px_rgb(30_41_59/16%)]"
          style={{ top: place.top, left: place.left, transform: 'translateX(-100%)' }}
        >
          <Link href={editHref} className={itemClass} onClick={onClose}>
            {t.admin.edit}
          </Link>
          <button type="button" className={itemClass} disabled={disabled} onClick={onDelete}>
            {t.admin.delete}
          </button>
          <Link href={viewHref} target="_blank" className={itemClass} onClick={onClose}>
            {t.admin.view}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
