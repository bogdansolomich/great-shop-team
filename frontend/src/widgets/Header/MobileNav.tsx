'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { useAuthOverlay } from '@/features/auth/context/AuthOverlayContext';
import { catalogRoutes } from '@/features/catalog/config/catalogRoutes';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetBrandsQuery } from '@/store/endpoints/brandsEndpoints';
import { isActivePath } from '@/widgets/Header/headerActionClasses';
import LanguageSwitcher from '@/widgets/LanguageSwitcher/LanguageSwitcher';

import { catalogMenuCategories } from '../Navigation/catalogMenuConfig';

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AccordionKey = 'brands' | 'catalog' | null;

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const titleId = useId();
  const [openSection, setOpenSection] = useState<AccordionKey>(null);
  const { isOpen: isAuthOpen } = useAuthOverlay();
  const { data: brands } = useGetBrandsQuery(undefined, { skip: !isOpen });

  useEffect(() => {
    setOpenSection(null);
    onClose();
    // Close drawer on route changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (isAuthOpen) onClose();
  }, [isAuthOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleSection = (key: Exclude<AccordionKey, null>) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const linkClass = (active: boolean) =>
    `block py-3 font-(family-name:--font-unbounded) text-base font-normal text-dark no-underline ${
      active ? 'opacity-100' : 'opacity-80'
    }`;

  const shopMenu = t.nav.shopMenu;
  const brandPreview = (brands ?? []).slice(0, 12);

  return (
    <div
      className={`fixed inset-0 z-110 lg:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 border-none bg-black/45 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={t.nav.closeMenu}
        onClick={onClose}
      />

      <nav
        id="mobile-nav"
        className={`absolute top-0 left-0 flex h-full w-[min(100%,360px)] flex-col bg-white text-dark shadow-[8px_0_32px_rgb(0_0_0/12%)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-labelledby={titleId}
      >
        <div className="flex h-[var(--site-header-height)] shrink-0 items-center justify-between border-b border-black/8 px-4">
          <p
            id={titleId}
            className="m-0 font-(family-name:--font-unbounded) text-base font-medium text-dark"
          >
            {t.nav.menu}
          </p>
          <button
            type="button"
            className="inline-flex size-10 cursor-pointer items-center justify-center border-none bg-transparent text-dark"
            aria-label={t.nav.closeMenu}
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <ul className="m-0 flex list-none flex-col p-0">
            <li>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-3 text-left font-(family-name:--font-unbounded) text-base font-normal text-dark"
                aria-expanded={openSection === 'catalog'}
                onClick={() => toggleSection('catalog')}
              >
                {t.nav.catalog}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`size-4 transition-transform ${openSection === 'catalog' ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openSection === 'catalog' ? (
                <ul className="mb-3 ml-1 flex list-none flex-col gap-1 border-l border-black/10 py-1 pl-3">
                  {catalogMenuCategories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={category.href}
                        className="block py-1.5 text-sm text-dark/80 no-underline"
                        onClick={onClose}
                      >
                        {t.catalog.categories[category.slug].navLabel}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={catalogRoutes.index}
                      className="block py-1.5 text-sm font-medium text-dark no-underline"
                      onClick={onClose}
                    >
                      {t.nav.viewFullCatalog}
                    </Link>
                  </li>
                </ul>
              ) : null}
            </li>
            <li>
              <Link
                href="/sales"
                className={linkClass(isActivePath(pathname, '/sales'))}
                onClick={onClose}
              >
                {t.nav.sales}
              </Link>
            </li>

            <li>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-3 text-left font-(family-name:--font-unbounded) text-base font-normal text-dark"
                aria-expanded={openSection === 'brands'}
                onClick={() => toggleSection('brands')}
              >
                {t.nav.brands}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`size-4 transition-transform ${openSection === 'brands' ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openSection === 'brands' ? (
                <ul className="mb-3 ml-1 flex list-none flex-col gap-2 border-l border-black/10 py-1 pl-3">
                  {brandPreview.map((brand) => (
                    <li key={brand.id}>
                      <Link
                        href={catalogRoutes.brands}
                        className="block py-1.5 text-sm text-dark/80 no-underline"
                        onClick={onClose}
                      >
                        {brand.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href={catalogRoutes.brands}
                      className="block py-1.5 text-sm font-medium text-dark no-underline"
                      onClick={onClose}
                    >
                      {t.nav.viewAllBrands}
                    </Link>
                  </li>
                </ul>
              ) : null}
            </li>
            <li className="border-t border-black/8 py-3">
              <LanguageSwitcher variant="inline" />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
