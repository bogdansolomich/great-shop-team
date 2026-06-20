'use client';

import CatalogFilter from '@/features/catalog/ui/CatalogFilter/CatalogFilter';
import CatalogSort from '@/features/catalog/ui/CatalogSort/CatalogSort';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import { catalogToolbar } from '@/features/catalog/ui/catalogClasses';

type CatalogToolbarProps = {
  stylesCount: number;
  onSortClick?: () => void;
  onFilterClick?: () => void;
};

export default function CatalogToolbar({
  stylesCount,
  onSortClick,
  onFilterClick,
}: CatalogToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className={catalogToolbar.root}>
      <div className={catalogToolbar.controls}>
        <CatalogSort onClick={onSortClick} />
        <CatalogFilter onClick={onFilterClick} />
      </div>

      <span className={catalogToolbar.stylesCount}>
        {formatMessage(t.catalog.stylesFound, { count: stylesCount })}
      </span>
    </div>
  );
}
