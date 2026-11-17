'use client';

import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { formatLocalizedPrice } from '@/features/catalog/lib/resolveVariantOffer';
import {
  useGetAdminOrderByIdQuery,
  useGetAdminOrdersQuery,
  usePatchAdminOrderStatusMutation,
} from '@/store/endpoints/adminEndpoints';
import type { AdminOrder } from '@/store/types';
import { adminButtonCompact } from './adminClasses';
import { formErrorText } from './formError';
import AdminPagination, { ADMIN_PAGE_SIZE } from './AdminPagination';

const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function statusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return 'border-[#d9dce2] bg-[#f5f6f8] text-[#5b6472]';
    case 'PROCESSING':
      return 'border-[#c6d8ff] bg-[#eff5ff] text-[#2459b3]';
    case 'SHIPPED':
      return 'border-[#f1d59a] bg-[#fff8e6] text-[#9a6b00]';
    case 'DELIVERED':
      return 'border-[#b8e3c4] bg-[#eefaf1] text-[#1B8A3E]';
    case 'CANCELED':
    case 'CANCELLED':
      return 'border-[#f3c7c3] bg-[#fff1f0] text-[#C0392B]';
    default:
      return 'border-[#e7eaf0] bg-white text-[#1d2433]';
  }
}

function statusLabel(status: string, t: ReturnType<typeof useTranslation>['t']) {
  switch (status.toUpperCase()) {
    case 'PENDING':
      return t.orders.pending;
    case 'PROCESSING':
      return t.orders.processing;
    case 'SHIPPED':
      return t.orders.shipped;
    case 'DELIVERED':
      return t.orders.delivered;
    case 'CANCELED':
    case 'CANCELLED':
      return t.orders.canceled;
    default:
      return status;
  }
}

function customerName(order: AdminOrder) {
  const nested = order.user;
  const fullName = [order.first_name ?? nested?.first_name, order.last_name ?? nested?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return (
    order.customer_name || fullName || order.customer_email || order.email || nested?.email || '—'
  );
}

function customerPhone(order: AdminOrder) {
  return order.customer_phone || order.phone || order.user?.phone || '—';
}

function orderQuantity(order: AdminOrder) {
  if (!Array.isArray(order.items)) return '—';
  return order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export default function AdminOrders() {
  const { t, locale } = useTranslation();
  const orders = useGetAdminOrdersQuery();
  const [patchStatus, updateState] = usePatchAdminOrderStatusMutation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const allOrders = orders.data ?? [];
  const totalPages = Math.ceil(allOrders.length / ADMIN_PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const visibleOrders = allOrders.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);
  const headings = {
    orderNumber: t.admin.orderNumber,
    orderDate: t.admin.orderDate,
    customer: t.admin.customer,
    phone: t.admin.phone,
    status: t.admin.status,
    quantity: t.admin.quantity,
    orderTotal: t.admin.orderTotal,
  };

  async function changeStatus(id: number, status: string) {
    setError('');
    try {
      await patchStatus({ id, status }).unwrap();
    } catch (requestError) {
      setError(formErrorText(requestError, t.admin.saveError));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <div>
        <h1 className="m-0 text-[28px] leading-tight font-bold">{t.admin.orders}</h1>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-sm text-[#ef4444]">
          {error}
        </p>
      ) : null}
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgb(30_41_59/6%)]">
        {orders.isLoading ? (
          <p className="m-0 px-5 py-6 text-sm text-[#6b7280]">{t.common.loading}</p>
        ) : null}
        {orders.isError ? (
          <p role="alert" className="m-0 px-5 py-6 text-sm text-[#ef4444]">
            {t.admin.loadError}
          </p>
        ) : null}
        {!orders.isLoading && !orders.isError && !orders.data?.length ? (
          <p className="m-0 px-5 py-6 text-sm text-[#6b7280]">{t.admin.empty}</p>
        ) : null}
        {allOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-[#9aa1ad] uppercase">
                  {Object.entries(headings).map(([key, heading]) => (
                    <th key={key} className="px-5 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const date = new Date(order.created_at);
                  const formattedDate = Number.isNaN(date.getTime())
                    ? order.created_at
                    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
                  const amount = formatLocalizedPrice(
                    Number(order.total_amount) || 0,
                    order.currency_code || 'USD',
                    locale,
                    { maximumFractionDigits: 2 },
                  );

                  return (
                    <tr key={order.id} className="border-t border-[#f1f3f7]">
                      <td className="px-5 py-4 font-semibold">#{order.id}</td>
                      <td className="px-5 py-4 text-[#6b7280]">{formattedDate}</td>
                      <td className="px-5 py-4">{customerName(order)}</td>
                      <td className="px-5 py-4">{customerPhone(order)}</td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`${t.admin.updateStatus}: ${order.id}`}
                          value={order.status.toUpperCase()}
                          disabled={updateState.isLoading}
                          onChange={(event) => void changeStatus(order.id, event.target.value)}
                          className={`h-10 rounded-lg border px-3 text-sm disabled:opacity-60 ${statusColor(order.status)}`}
                        >
                          {!orderStatuses.includes(
                            order.status.toUpperCase() as (typeof orderStatuses)[number],
                          ) ? (
                            <option value={order.status.toUpperCase()}>
                              {statusLabel(order.status, t)}
                            </option>
                          ) : null}
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status, t)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">{orderQuantity(order)}</td>
                      <td className="px-5 py-4 font-semibold">{amount}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className={adminButtonCompact}
                        >
                          {t.admin.orderDetails}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {!orders.isLoading && !orders.isError && allOrders.length > 0 ? (
          <AdminPagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            totalItems={allOrders.length}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
      {selectedOrderId !== null ? (
        <AdminOrderDetails id={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      ) : null}
    </div>
  );
}

function AdminOrderDetails({ id, onClose }: { id: number; onClose: () => void }) {
  const { t, locale } = useTranslation();
  const orderQuery = useGetAdminOrderByIdQuery(id);
  const order = orderQuery.data;
  const [currentItemPage, setCurrentItemPage] = useState(1);
  const items = order?.items ?? [];
  const totalItemPages = Math.ceil(items.length / ADMIN_PAGE_SIZE);
  const itemPage = Math.min(currentItemPage, Math.max(totalItemPages, 1));
  const visibleItems = items.slice((itemPage - 1) * ADMIN_PAGE_SIZE, itemPage * ADMIN_PAGE_SIZE);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-details-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="admin-order-details-title" className="m-0 text-xl font-bold">
            {t.admin.orderDetails} #{id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.admin.cancel}
            className="cursor-pointer border-0 bg-transparent text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {orderQuery.isLoading ? (
          <p className="mt-5 text-sm text-[#6b7280]">{t.common.loading}</p>
        ) : null}
        {orderQuery.isError ? (
          <p role="alert" className="mt-5 text-sm text-[#ef4444]">
            {t.admin.loadError}
          </p>
        ) : null}
        {order ? (
          <div className="mt-5 flex flex-col gap-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label={t.admin.customer} value={customerName(order)} />
              <Info label={t.admin.phone} value={customerPhone(order)} />
              <Info
                label={t.admin.customerEmail}
                value={order.customer_email || order.email || order.user?.email || '—'}
              />
              <div>
                <dt className="text-xs font-semibold uppercase text-[#9aa1ad]">{t.admin.status}</dt>
                <dd className="m-0 mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}
                  >
                    {statusLabel(order.status, t)}
                  </span>
                </dd>
              </div>
              <Info
                label={t.admin.orderDate}
                value={
                  Number.isNaN(new Date(order.created_at).getTime())
                    ? order.created_at
                    : new Intl.DateTimeFormat(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(order.created_at))
                }
              />
            </dl>
            <div className="overflow-x-auto rounded-xl border border-[#e7eaf0]">
              {order.items.length ? (
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#f8f9fc] text-[#6b7280]">
                      <th className="px-4 py-3 font-medium">{t.admin.item}</th>
                      <th className="px-4 py-3 font-medium">{t.admin.quantity}</th>
                      <th className="px-4 py-3 font-medium">{t.admin.orderTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="border-t border-[#e7eaf0]">
                        <td className="px-4 py-3">{item.product_name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">
                          {formatLocalizedPrice(
                            Number(item.line_total) || 0,
                            order.currency_code || 'USD',
                            locale,
                            { maximumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="m-0 px-4 py-3 text-sm text-[#6b7280]">{t.admin.noOrderItems}</p>
              )}
            </div>
            {items.length > 0 ? (
              <AdminPagination
                page={itemPage}
                pageSize={ADMIN_PAGE_SIZE}
                totalItems={items.length}
                onPageChange={setCurrentItemPage}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#9aa1ad]">{label}</dt>
      <dd className="m-0 mt-1 text-[#1d2433]">{value}</dd>
    </div>
  );
}
