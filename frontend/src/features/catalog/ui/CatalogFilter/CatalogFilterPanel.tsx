'use client';

import { useEffect, useRef, useState } from 'react';

import type {
  CatalogGenderFilter,
  CatalogGroupFilter,
} from '@/features/catalog/model/catalogFilters';
import { catalogFilterPanel } from '@/features/catalog/ui/catalogClasses';
import type { Brand, CatalogColor, CatalogSize } from '@/store/types';
import { getColorLabel } from '@/i18n/colorLabel';
import { useTranslation } from '@/i18n/useTranslation';

export type FilterDraft = {
  gender: CatalogGenderFilter[];
  subcategory: string[];
  group: CatalogGroupFilter[];
  size: string[];
  color: string[];
  brand: string[];
  minPrice: string;
  maxPrice: string;
};

type CatalogFilterPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Options offered by the current category. An empty list means the filter does not apply
   * to this category, so its section is not rendered at all.
   */
  groups: CatalogGroupFilter[];
  sizes: CatalogSize[];
  /** `size_type` of `sizes`; perfume sizes are volumes, so the section is titled accordingly. */
  sizeKind?: string;
  colors: CatalogColor[];
  brands: Brand[];
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
  selectedSubcategories: string[];
  selectedGenders: CatalogGenderFilter[];
  selectedGroups: CatalogGroupFilter[];
  selectedMinPrice?: number;
  selectedMaxPrice?: number;
  onApply: (next: FilterDraft) => void;
  onClear: () => void;
};

type AccordionId = 'categories' | 'size' | 'color' | 'brand';

type FilterOption<T extends string> = { value: T; label: string };

const EMPTY_DRAFT: FilterDraft = {
  gender: [],
  subcategory: [],
  group: [],
  size: [],
  color: [],
  brand: [],
  minPrice: '',
  maxPrice: '',
};

const ALL_SECTIONS_CLOSED: Record<AccordionId, boolean> = {
  categories: false,
  size: false,
  color: false,
  brand: false,
};

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function AccordionIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`size-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5"
      aria-hidden
    >
      <path
        d="M3.5 8.2 6.4 11.2 12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckboxControl({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center border ${
        checked ? 'border-black bg-black text-white' : 'border-black/35 bg-white text-transparent'
      }`}
      aria-hidden
    >
      <CheckMark />
    </span>
  );
}

type FilterAccordionProps<T extends string> = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  options: FilterOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
};

function FilterAccordion<T extends string>({
  title,
  isOpen,
  onToggle,
  options,
  selected,
  onChange,
}: FilterAccordionProps<T>) {
  return (
    <section>
      <button
        type="button"
        className={catalogFilterPanel.accordionBtn}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {title}
        <AccordionIcon open={isOpen} />
      </button>
      {isOpen ? (
        <ul className={catalogFilterPanel.optionList}>
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <li key={option.value}>
                <label className={catalogFilterPanel.optionLabel}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onChange(toggleValue(selected, option.value))}
                  />
                  <CheckboxControl checked={checked} />
                  {option.label}
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export default function CatalogFilterPanel({
  isOpen,
  onClose,
  groups,
  sizes,
  sizeKind,
  colors,
  brands,
  selectedBrands,
  selectedColors,
  selectedSizes,
  selectedSubcategories,
  selectedGenders,
  selectedGroups,
  selectedMinPrice,
  selectedMaxPrice,
  onApply,
  onClear,
}: CatalogFilterPanelProps) {
  const { t, locale } = useTranslation();
  const [openSections, setOpenSections] =
    useState<Record<AccordionId, boolean>>(ALL_SECTIONS_CLOSED);
  const [draft, setDraft] = useState<FilterDraft>({
    gender: selectedGenders,
    subcategory: selectedSubcategories,
    group: selectedGroups,
    size: selectedSizes,
    color: selectedColors,
    brand: selectedBrands,
    minPrice: selectedMinPrice?.toString() ?? '',
    maxPrice: selectedMaxPrice?.toString() ?? '',
  });

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return;

    // Start from what is applied right now. Nothing is pre-selected: no filter means "show all".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({
      gender: selectedGenders,
      subcategory: selectedSubcategories,
      group: selectedGroups,
      size: selectedSizes,
      color: selectedColors,
      brand: selectedBrands,
      minPrice: selectedMinPrice?.toString() ?? '',
      maxPrice: selectedMaxPrice?.toString() ?? '',
    });
    setOpenSections(ALL_SECTIONS_CLOSED);
  }, [
    isOpen,
    selectedGenders,
    selectedSubcategories,
    selectedGroups,
    selectedMinPrice,
    selectedMaxPrice,
    selectedSizes,
    selectedColors,
    selectedBrands,
  ]);

  const toggleSection = (id: AccordionId) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const setList = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const clearAll = () => {
    setDraft(EMPTY_DRAFT);
    onClear();
  };

  const groupOptions = groups.map((value) => ({
    value,
    label: t.catalog.categoryGroups[value],
  }));
  const sizeOptions = sizes.map((item) => ({ value: String(item.id), label: item.name }));
  const colorOptions = colors
    .map((item) => ({ value: String(item.id), label: getColorLabel(item.name, t.colors) }))
    .sort((left, right) => left.label.localeCompare(right.label, locale));
  const brandOptions = brands.map((item) => ({ value: String(item.id), label: item.name }));
  const sizeTitle =
    sizeKind === 'perfume' ? t.catalog.filterGroups.volume : t.catalog.filterGroups.size;

  return (
    <div
      className={`${catalogFilterPanel.overlay} ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={`${catalogFilterPanel.backdrop} ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        aria-label={t.catalog.closeFilters}
        onClick={onClose}
      />

      <aside
        className={`${catalogFilterPanel.aside} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal={isOpen}
        aria-label={t.catalog.filterAndSort}
      >
        <div className={catalogFilterPanel.header}>
          <h2 className={catalogFilterPanel.title}>{t.catalog.filterAndSort}</h2>
          <button
            type="button"
            className={catalogFilterPanel.closeBtn}
            onClick={onClose}
            aria-label={t.catalog.closeFilters}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-7"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={catalogFilterPanel.body}>
          <section className="border-b border-black/10 pb-4">
            <h3 className="m-0 mb-3 text-base font-medium text-black">
              {t.catalog.filterGroups.price}
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded border border-black/20 px-3">
                <span aria-hidden className="text-sm text-black/60">
                  {locale === 'uk' ? '₴' : '$'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  aria-label={t.catalog.minPrice}
                  placeholder={t.catalog.minPrice}
                  value={draft.minPrice}
                  onChange={(event) => setList('minPrice', event.target.value)}
                  className="h-10 w-full min-w-0 border-0 bg-transparent text-sm outline-none"
                />
              </label>
              <span aria-hidden className="text-black/50">
                —
              </span>
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded border border-black/20 px-3">
                <span aria-hidden className="text-sm text-black/60">
                  {locale === 'uk' ? '₴' : '$'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  aria-label={t.catalog.maxPrice}
                  placeholder={t.catalog.maxPrice}
                  value={draft.maxPrice}
                  onChange={(event) => setList('maxPrice', event.target.value)}
                  className="h-10 w-full min-w-0 border-0 bg-transparent text-sm outline-none"
                />
              </label>
            </div>
          </section>

          {groupOptions.length > 0 ? (
            <FilterAccordion
              title={t.catalog.filterGroups.categories}
              isOpen={openSections.categories}
              onToggle={() => toggleSection('categories')}
              options={groupOptions}
              selected={draft.group}
              onChange={(next) => setList('group', next)}
            />
          ) : null}

          {sizeOptions.length > 0 ? (
            <FilterAccordion
              title={sizeTitle}
              isOpen={openSections.size}
              onToggle={() => toggleSection('size')}
              options={sizeOptions}
              selected={draft.size}
              onChange={(next) => setList('size', next)}
            />
          ) : null}

          {colorOptions.length > 0 ? (
            <FilterAccordion
              title={t.catalog.filterGroups.color}
              isOpen={openSections.color}
              onToggle={() => toggleSection('color')}
              options={colorOptions}
              selected={draft.color}
              onChange={(next) => setList('color', next)}
            />
          ) : null}

          {brandOptions.length > 0 ? (
            <FilterAccordion
              title={t.catalog.filterGroups.brand}
              isOpen={openSections.brand}
              onToggle={() => toggleSection('brand')}
              options={brandOptions}
              selected={draft.brand}
              onChange={(next) => setList('brand', next)}
            />
          ) : null}
        </div>

        <div className={catalogFilterPanel.footer}>
          <button
            type="button"
            className={catalogFilterPanel.applyBtn}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {t.catalog.applyFilters}
          </button>
          <button type="button" className={catalogFilterPanel.clearBtn} onClick={clearAll}>
            {t.catalog.clearFilters}
          </button>
        </div>
      </aside>
    </div>
  );
}
