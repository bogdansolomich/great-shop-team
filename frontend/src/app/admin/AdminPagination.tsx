'use client';

import { useTranslation } from '@/i18n/useTranslation';

export const ADMIN_PAGE_SIZE = 10;

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export default function AdminPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: AdminPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const pageNumbers = [
    ...new Set([1, page - 1, page, page + 1, totalPages].filter((value) => value > 0)),
  ].sort((left, right) => left - right);
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f2f6] px-5 py-4">
      <p className="m-0 text-sm text-neutral-500">
        {firstItem}–{lastItem} {t.admin.of} {totalItems}
      </p>
      <nav className="flex items-center gap-1" aria-label={t.admin.pagination}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-700 hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.admin.previousPage}
        </button>
        {pageNumbers.map((pageNumber, index) => (
          <span key={pageNumber} className="flex items-center gap-1">
            {index > 0 && pageNumber - pageNumbers[index - 1] > 1 ? (
              <span className="px-1 text-neutral-400" aria-hidden>
                …
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
              className={`size-9 rounded-lg border text-sm ${
                pageNumber === page
                  ? 'border-black bg-black font-semibold text-white'
                  : 'border-transparent text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {pageNumber}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm text-neutral-700 hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.admin.nextPage}
        </button>
      </nav>
    </div>
  );
}
