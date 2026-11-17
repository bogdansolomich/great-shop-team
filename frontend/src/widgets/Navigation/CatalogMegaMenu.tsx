'use client';

import Image from 'next/image';
import Link from 'next/link';

import { catalogRoutes } from '@/features/catalog/config/catalogRoutes';
import { useTranslation } from '@/i18n/useTranslation';

import { catalogMenuCategories } from './catalogMenuConfig';
import { headerNav } from './navigationClasses';

export default function CatalogMegaMenu() {
  const { t } = useTranslation();

  return (
    <div>
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {catalogMenuCategories.map((category) => (
          <li key={category.slug}>
            <Link href={category.href} className="group flex flex-col gap-3 no-underline">
              <span className="relative block aspect-[4/5] overflow-hidden bg-[#f3f3f3]">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 45vw, 220px"
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </span>
              <span className="font-(family-name:--font-unbounded) text-sm font-medium text-dark">
                {t.catalog.categories[category.slug].navLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={headerNav.brandsFooter}>
        <Link href={catalogRoutes.index} className={headerNav.shopColumnLink}>
          {t.nav.viewFullCatalog}
        </Link>
      </div>
    </div>
  );
}
