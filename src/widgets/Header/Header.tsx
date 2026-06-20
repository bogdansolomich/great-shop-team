'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import LanguageSwitcher from '@/widgets/LanguageSwitcher/LanguageSwitcher';
import Navigation from '@/widgets/Navigation/Navigation';
import MyAccount from '@/widgets/MyAccount/MyAccount';
import WishList from '@/widgets/WishList/WishList';
import ShoppingBag from '@/widgets/ShoppingBag/ShoppingBag';
import { hasBannerHeader } from '@/widgets/Header/headerBannerRoutes';

const scrollThreshold = 24;

export default function Header() {
  const pathname = usePathname();
  const bannerHeader = hasBannerHeader(pathname);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!bannerHeader) {
      return undefined;
    }

    const onScroll = () => {
      setScrollY(window.scrollY);
    };

    const frame = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [bannerHeader, pathname]);

  const isTransparent = bannerHeader && scrollY <= scrollThreshold;

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-100 w-full transition-[background-color,color,box-shadow] duration-300 ease-in-out ${
        isTransparent
          ? 'bg-transparent text-white [&_img]:brightness-0 [&_img]:invert'
          : 'bg-white text-dark shadow-[inset_0_-6px_20px_-8px_rgb(0_0_0/9%)]'
      }`}
    >
      <div className="layout-gutter box-border flex w-full items-center justify-between py-5 font-(family-name:--font-unbounded) [&>.actions]:shrink [&>div:first-child]:shrink [&>div:first-child]:basis-[176px] [&>.actions]:basis-[176px]">
        <div>
          <LanguageSwitcher />
        </div>

        <div>
          <Navigation />
        </div>

        <div className="actions flex justify-between">
          <Suspense fallback={null}>
            <MyAccount isHeaderTransparent={isTransparent} />
          </Suspense>
          <WishList />
          <ShoppingBag />
        </div>
      </div>
    </header>
  );
}
