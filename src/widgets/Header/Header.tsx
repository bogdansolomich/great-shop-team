import { Suspense } from 'react';

import LanguageSwitcher from '@/widgets/LanguageSwitcher/LanguageSwitcher';
import Navigation from '@/widgets/Navigation/Navigation';
import MyAccount from '@/widgets/MyAccount/MyAccount';
import WishList from '@/widgets/WishList/WishList';
import ShoppingBag from '@/widgets/ShoppingBag/ShoppingBag';

import styles from '../Header/Header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerRoot}>
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
