'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { catalogRoutes } from '@/features/catalog/config/catalogRoutes';
import { useTranslation } from '@/i18n/useTranslation';
import { isActivePath } from '@/widgets/Header/headerActionClasses';

import BrandsMegaMenu from './BrandsMegaMenu';
import CatalogMegaMenu from './CatalogMegaMenu';
import NavMegaMenuItem from './NavMegaMenuItem';
import { getNavLinkClass, headerNav } from './navigationClasses';

export default function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isCatalogActive = isActivePath(pathname, '/catalog');
  const isSalesActive = isActivePath(pathname, '/sales');

  return (
    <nav aria-label="Main" className="h-full">
      <ul className={headerNav.list}>
        <NavMegaMenuItem
          label={t.nav.catalog}
          isActive={isCatalogActive}
          panelLabel={t.nav.catalogMenuAriaLabel}
          panel={<CatalogMegaMenu />}
        />

        <li>
          <Link
            href="/sales"
            className={getNavLinkClass(isSalesActive)}
            aria-current={isSalesActive ? 'page' : undefined}
          >
            {t.nav.sales}
          </Link>
        </li>

        <NavMegaMenuItem
          label={t.nav.brands}
          href={catalogRoutes.brands}
          isActive={false}
          panelLabel={t.nav.brandsMenuAriaLabel}
          panel={<BrandsMegaMenu />}
        />

      </ul>
    </nav>
  );
}
