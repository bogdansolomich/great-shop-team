'use client';

import { useEffect, useRef, useState } from 'react';

import CatalogFilter from '@/features/catalog/ui/CatalogFilter/CatalogFilter';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import { catalogToolbar } from '@/features/catalog/ui/catalogClasses';
import type { CatalogSortOption } from '@/features/catalog/model/catalogFilters';

type CatalogToolbarProps = {
  stylesCount: number;
  onFilterClick: () => void;
  sort: CatalogSortOption;
  onSortChange: (sort: CatalogSortOption) => void;
  activeFilterCount?: number;
};

export default function CatalogToolbar({
  stylesCount,
  onFilterClick,
  sort,
  onSortChange,
  activeFilterCount = 0,
}: CatalogToolbarProps) {
  const { t } = useTranslation();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions: Array<{ value: CatalogSortOption; label: string }> = [
    { value: 'featured', label: t.catalog.sortOptions.recommended },
    { value: 'price_asc', label: t.catalog.sortOptions.priceAsc },
    { value: 'price_desc', label: t.catalog.sortOptions.priceDesc },
    { value: 'newest', label: t.catalog.sortOptions.newest },
    { value: 'bestsellers', label: t.catalog.sortOptions.bestsellers },
  ];

  useEffect(() => {
    if (!isSortOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) setIsSortOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  return (
    <div className={catalogToolbar.root}>
      <div className={catalogToolbar.controls}>
        <div ref={sortRef} className="relative">
          <button
            type="button"
            className={`${catalogToolbar.control} min-w-0 max-w-[52%] md:max-w-none`}
            onClick={() => setIsSortOpen((open) => !open)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
          >
            <span className="min-w-0 truncate">{t.catalog.sort}</span>
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
          {isSortOpen ? (
            <ul
              className="absolute top-full left-0 z-30 mt-1 min-w-52 list-none rounded border border-black/10 bg-white p-1 shadow-lg"
              role="listbox"
              aria-label={t.catalog.sort}
            >
              {sortOptions.map((option) => (
                <li key={option.value} role="option" aria-selected={sort === option.value}>
                  <button
                    type="button"
                    className={`w-full cursor-pointer rounded border-0 px-3 py-2 text-left text-sm ${
                      sort === option.value
                        ? 'bg-black/8 font-medium text-black'
                        : 'bg-white text-black hover:bg-black/5'
                    }`}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsSortOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <CatalogFilter onClick={onFilterClick} activeCount={activeFilterCount} />
      </div>

      <span className={catalogToolbar.stylesCount}>
        {formatMessage(t.catalog.stylesFound, { count: stylesCount })}
      </span>
    </div>
  );
}
