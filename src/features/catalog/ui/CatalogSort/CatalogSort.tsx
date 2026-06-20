'use client';

import { useTranslation } from '@/i18n/useTranslation';
import { catalogToolbar } from '@/features/catalog/ui/catalogClasses';

type CatalogSortProps = {
  onClick?: () => void;
};

export default function CatalogSort({ onClick }: CatalogSortProps) {
  const { t } = useTranslation();

  return (
    <button type="button" className={catalogToolbar.control} onClick={onClick}>
      {t.catalog.sort}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
        />
      </svg>
    </button>
  );
}
