'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslation } from '@/i18n/useTranslation';
import Logo from '../Logo/Logo';
import CatalogNavMenu from './CatalogNavMenu';
import { getHeaderActionClass, isActivePath } from '@/widgets/Header/headerActionClasses';

export default function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isSalesActive = isActivePath(pathname, '/sales');

  return (
    <nav aria-label="Main">
      <ul className="flex items-center justify-center gap-8">
        <CatalogNavMenu />
        <li>
          <Logo />
        </li>
        <li>
          <Link
            href="/sales"
            className={getHeaderActionClass(isSalesActive)}
            aria-current={isSalesActive ? 'page' : undefined}
          >
            {t.nav.sales}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
