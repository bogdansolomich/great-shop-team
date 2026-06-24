'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { catalogCategoriesConfig } from '@/features/catalog/config/catalogCategories';
import { CATALOG_CATEGORY_SLUGS } from '@/features/catalog/model/catalogCategory';
import { useTranslation } from '@/i18n/useTranslation';
import { getHeaderActionClass, isActivePath } from '@/widgets/Header/headerActionClasses';

import { catalogNavMenu } from './navigationClasses';

export default function CatalogNavMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isCatalogActive = isActivePath(pathname, '/catalog');
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <li
      className={catalogNavMenu.trigger}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          close();
        }
      }}
    >
      <Link
        href="/catalog/women"
        className={getHeaderActionClass(isCatalogActive)}
        aria-current={isCatalogActive ? 'page' : undefined}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {t.nav.catalog}
      </Link>

      {isOpen ? (
        <div className={catalogNavMenu.dropdown}>
          <div
            className={catalogNavMenu.panel}
            role="navigation"
            aria-label={t.catalog.categoryNavAriaLabel}
          >
            <ul className={catalogNavMenu.panelList}>
              {CATALOG_CATEGORY_SLUGS.map((category) => {
                const href = catalogCategoriesConfig[category].href;
                const isActive = isActivePath(pathname, href);

                return (
                  <li key={category}>
                    <Link
                      href={href}
                      className={`${catalogNavMenu.panelLink} ${
                        isActive ? catalogNavMenu.panelLinkActive : ''
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {t.catalog.categories[category].navLabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}
