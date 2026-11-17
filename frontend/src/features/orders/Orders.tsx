'use client';

import Image from 'next/image';
import { useState } from 'react';
import { HiChevronDown, HiOutlineShoppingBag } from 'react-icons/hi2';

import { formatLocalizedPrice, pickMainImageUrl } from '@/features/catalog/lib/resolveVariantOffer';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import { useGetProductImagesQuery } from '@/store/endpoints/catalogMetaEndpoints';
import { useGetOrdersQuery } from '@/store/endpoints/ordersEndpoints';
import type { ApiOrder, ApiOrderItem, ProductImageRecord } from '@/store/types';

const statusClass: Record<string, string> = {
  CANCELLED: 'border-[#f3c7c3] bg-[#fff1f0] text-[#C0392B]',
  DELIVERED: 'border-[#b8e3c4] bg-[#eefaf1] text-[#1B8A3E]',
  SHIPPED: 'border-[#f1d59a] bg-[#fff8e6] text-[#9a6b00]',
  PROCESSING: 'border-[#c6d8ff] bg-[#eff5ff] text-[#2459b3]',
  PENDING: 'border-[#d9dce2] bg-[#f5f6f8] text-[#5b6472]',
};

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatMoney(amount: string, currency: string, locale: 'uk' | 'en') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return formatLocalizedPrice(value, currency, locale, { maximumFractionDigits: 2 });
}

function itemImage(item: ApiOrderItem, images: ProductImageRecord[]) {
  if (item.product_variant == null) return undefined;
  const variantImages = images.filter(
    (image) => Number(image.product_variant) === Number(item.product_variant),
  );
  return pickMainImageUrl(variantImages);
}

function OrderProductRow({
  item,
  currency,
  locale,
  images,
}: {
  item: ApiOrderItem;
  currency: string;
  locale: 'uk' | 'en';
  images: ProductImageRecord[];
}) {
  const { t } = useTranslation();
  const src = itemImage(item, images);

  return (
    <div className="flex items-center gap-4 px-4 py-4 md:px-5">
      <div className="relative size-16 shrink-0 overflow-hidden bg-neutral-100">
        {src ? (
          <Image src={src} alt={item.product_name} fill sizes="64px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold text-dark">{item.product_name}</p>
        <p className="m-0 text-xs text-dark/45">
          {formatMessage(t.orders.productCode, { code: item.sku })}
        </p>
        <p className="m-0 text-sm text-dark">{item.size}</p>
        <p className="m-0 text-sm text-dark">
          {t.orders.quantity}: {item.quantity}
        </p>
      </div>
      <p className="m-0 shrink-0 text-sm font-medium text-dark">
        {formatMoney(item.line_total, currency, locale)}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  images,
  locale,
}: {
  order: ApiOrder;
  images: ProductImageRecord[];
  locale: 'uk' | 'en';
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const statusLabel: Record<string, string> = {
    CANCELLED: t.orders.canceled,
    DELIVERED: t.orders.delivered,
    SHIPPED: t.orders.shipped,
    PROCESSING: t.orders.processing,
    PENDING: t.orders.pending,
  };

  return (
    <article className="rounded-xl border border-neutral-200">
      <div className="flex flex-col gap-4 px-4 py-4 md:px-5 lg:landscape:flex-row lg:landscape:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 lg:landscape:grid-cols-5">
          <div className="min-w-0">
            <p className="m-0 text-xs break-words text-dark/50">{t.orders.orderNumber}</p>
            <p className="m-0 mt-1 text-sm font-medium break-words text-dark">{order.id}</p>
          </div>
          <div className="min-w-0">
            <p className="m-0 text-xs break-words text-dark/50">{t.orders.datePlaced}</p>
            <p className="m-0 mt-1 text-sm font-medium break-words text-dark">
              {formatOrderDate(order.created_at)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="m-0 text-xs break-words text-dark/50">{t.orders.quantity}</p>
            <p className="m-0 mt-1 text-sm font-medium break-words text-dark">
              {order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="m-0 text-xs break-words text-dark/50">{t.orders.totalAmount}</p>
            <p className="m-0 mt-1 text-sm font-medium break-words text-dark">
              {formatMoney(order.total_amount, order.currency_code, locale)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="m-0 text-xs break-words text-dark/50">{t.orders.status}</p>
            <p className="m-0 mt-1">
              <span
                className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-center text-xs font-semibold whitespace-normal ${statusClass[order.status] ?? 'border-neutral-200 bg-neutral-50 text-dark'}`}
              >
                {statusLabel[order.status] ?? order.status}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`order-items-${order.id}`}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-black px-4 text-sm text-white lg:landscape:w-auto lg:landscape:shrink-0"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {t.orders.viewOrder}
          <HiChevronDown
            aria-hidden
            className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {isExpanded ? (
        <div
          id={`order-items-${order.id}`}
          className="divide-y divide-neutral-200 border-t border-neutral-200"
        >
          {order.items.map((item) => (
            <OrderProductRow
              key={item.id}
              item={item}
              currency={order.currency_code}
              locale={locale}
              images={images}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function EmptyOrders() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-90 flex-col items-center justify-center gap-4 px-6 text-center">
      <HiOutlineShoppingBag className="size-16 text-neutral-300" aria-hidden />
      <p className="m-0 max-w-sm text-sm text-dark/70">{t.orders.empty}</p>
    </div>
  );
}

export default function Orders() {
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const ordersQuery = useGetOrdersQuery(undefined, { skip: !token });
  const orders = ordersQuery.data ?? [];
  const imagesQuery = useGetProductImagesQuery(undefined, { skip: orders.length === 0 });

  if (token && (ordersQuery.isLoading || ordersQuery.isUninitialized)) {
    return <p className="m-0 text-sm text-dark/70">{t.common.loading}</p>;
  }

  if (ordersQuery.isError) {
    return <p className="m-0 text-sm text-dark/70">{t.common.error}</p>;
  }

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} images={imagesQuery.data ?? []} locale={locale} />
      ))}
    </div>
  );
}
