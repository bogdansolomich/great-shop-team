'use client';

import { useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

import {
  adminButtonCompact,
  adminHeading,
  adminMessage,
  adminPanel,
  adminPanelHead,
  adminSearch,
  adminTable,
  adminTableWrap,
  adminTd,
  adminTh,
} from './adminClasses';
import AdminPagination, { ADMIN_PAGE_SIZE } from './AdminPagination';

export type AdminRecord = {
  id: number;
  name: string;
  name_uk?: string | null;
  name_en?: string | null;
  slug: string;
  is_active: boolean;
  is_hidden: boolean;
  category?: number;
};

type AdminDirectoryProps = {
  title: string;
  items: AdminRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  categories?: { id: number; name: string; name_uk?: string | null; name_en?: string | null }[];
  showCategory?: boolean;
  onEdit?: (item: AdminRecord) => void;
};

export default function AdminDirectory({
  title,
  items,
  isLoading,
  isError,
  categories = [],
  showCategory = false,
  onEdit,
}: AdminDirectoryProps) {
  const { t, locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const categoryName = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          locale === 'uk' ? category.name_uk || category.name : category.name_en || category.name,
        ]),
      ),
    [categories, locale],
  );

  const filtered = (items ?? []).filter((item) => {
    const haystack =
      `${item.name} ${item.name_uk ?? ''} ${item.name_en ?? ''} ${item.slug}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedItems = filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  return (
    <section className={adminPanel}>
      <div className={adminPanelHead}>
        <h2 className={adminHeading}>{title}</h2>
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t.admin.search}
          aria-label={t.admin.search}
          className={adminSearch}
        />
      </div>
      {isLoading ? <p className={adminMessage}>{t.common.loading}</p> : null}
      {isError ? <p className={adminMessage}>{t.admin.loadError}</p> : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <p className={adminMessage}>{t.admin.empty}</p>
      ) : null}
      {filtered.length > 0 ? (
        <div className={adminTableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th className={adminTh}>{t.admin.name}</th>
                <th className={adminTh}>{t.admin.slug}</th>
                {showCategory ? <th className={adminTh}>{t.admin.parentCategory}</th> : null}
                <th className={adminTh}>{t.admin.status}</th>
                {onEdit ? <th className={adminTh}>{t.admin.actions}</th> : null}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td className={adminTd}>
                    {locale === 'uk'
                      ? item.name_uk || item.name || item.name_en
                      : item.name_en || item.name || item.name_uk}
                  </td>
                  <td className={adminTd}>{item.slug}</td>
                  {showCategory ? (
                    <td className={adminTd}>
                      {item.category ? (categoryName.get(item.category) ?? '—') : '—'}
                    </td>
                  ) : null}
                  <td className={adminTd}>
                    {item.is_hidden
                      ? t.admin.hidden
                      : item.is_active === false
                        ? t.admin.inactive
                        : t.admin.active}
                  </td>
                  {onEdit ? (
                    <td className={adminTd}>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className={adminButtonCompact}
                      >
                        {t.admin.edit}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!isLoading && !isError && filtered.length > 0 ? (
        <AdminPagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </section>
  );
}
