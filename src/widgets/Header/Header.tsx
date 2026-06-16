'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import LanguageSwitcher from '@/widgets/LanguageSwitcher/LanguageSwitcher';
import Navigation from '@/widgets/Navigation/Navigation';
import MyAccount from '@/widgets/MyAccount/MyAccount';
import WishList from '@/widgets/WishList/WishList';
import ShoppingBag from '@/widgets/ShoppingBag/ShoppingBag';

import styles from '../Header/Header.module.scss';

const scrollThreshold = 24;

export default function Header() {
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) {
      setIsScrolled(false);
      return undefined;
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [isLanding]);

  const isTransparent = isLanding && !isScrolled;

  return (
    <header
      className={`${styles.headerRoot} ${isTransparent ? styles.transparent : ''} ${isScrolled ? styles.scrolled : ''}`}
    >
      <div className={styles.header}>
        <div className={styles.language}>
          <LanguageSwitcher />
        </div>

        <div className={styles.navigation}>
          <Navigation />
        </div>

        <div className={styles.actions}>
          <Suspense fallback={null}>
            <MyAccount />
          </Suspense>
          <WishList />
          <ShoppingBag />
        </div>
      </div>
    </header>
  );
}
