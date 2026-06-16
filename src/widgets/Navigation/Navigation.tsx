'use client';

import Link from 'next/link';

import { useTranslation } from '@/i18n/useTranslation';
import Logo from '../Logo/Logo';

import styles from '../Navigation/Navigation.module.scss';

export default function Navigation() {
  const { t } = useTranslation();

  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link href="/catalog" className={styles.navLink}>
            {t.nav.newArrivals}
          </Link>
        </li>
        <li className={styles.navItem}>
          <Logo />
        </li>
        <li className={styles.navItem}>
          <Link href="/catalog" className={styles.navLink}>
            {t.nav.women}
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/catalog" className={styles.navLink}>
            {t.nav.men}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
