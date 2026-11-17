'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useDispatch } from 'react-redux';

import { useCartDrawer } from '@/features/cart/context/CartDrawerContext';
import WishlistButton from '@/features/wishlist/ui/WishlistButton/WishlistButton';
import { useTranslation } from '@/i18n/useTranslation';
import { addToCart } from '@/store/slices/cartSlice';
import type { CartItem } from '@/store/types';

type LandingProductCardProps = {
  id: string;
  href: string;
  image: { src: string; alt: string };
  title: string;
  price: string;
  compareAt?: string;
  badge?: string;
  imageClassName?: string;
  ctaLabel?: string;
  addToCartLine?: Omit<CartItem, 'quantity'> | null;
  relaxed?: boolean;
  className?: string;
};

export default function LandingProductCard({
  id,
  href,
  image,
  title,
  price,
  compareAt,
  badge,
  imageClassName = 'object-contain object-center',
  ctaLabel,
  addToCartLine,
  relaxed = false,
  className = '',
}: LandingProductCardProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { openCart } = useCartDrawer();

  function handleAddToCart() {
    if (!addToCartLine) return;
    dispatch(addToCart({ ...addToCartLine, quantity: 1 }));
    openCart();
  }

  const plusClassName =
    'absolute right-2 bottom-2 z-1 flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-black text-white no-underline transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:hover:scale-100 md:right-2.5 md:bottom-2.5 md:size-11';

  return (
    <article
      className={`group flex h-full w-full flex-col ${relaxed ? 'gap-6 md:gap-8' : 'gap-2.5 md:gap-3'} ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white shadow-[0_10px_28px_rgb(19_17_24/12%)]">
        <Link href={href} className="absolute inset-0 p-2.5 md:p-3.5">
          <span className="relative block size-full">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 45vw, (max-width: 1280px) 24vw, 18vw"
              className={`contrast-[1.14] transition-transform duration-500 ease-out group-hover:scale-[1.03] ${imageClassName}`}
            />
          </span>
        </Link>

        {badge ? (
          <span className="absolute top-2 left-2 z-1 rounded-full bg-black px-2.5 py-1 font-(family-name:--font-unbounded) text-[10px] leading-none font-medium text-white md:top-3 md:left-3 md:text-xs">
            {badge}
          </span>
        ) : null}

        <div className="absolute top-1.5 right-1.5 z-1 md:top-2 md:right-2">
          <WishlistButton
            productId={id}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-dark transition-transform hover:scale-110"
            iconClassName="size-5"
          />
        </div>

        {addToCartLine === undefined ? (
          <Link href={href} className={plusClassName} aria-label={t.landing.addToCart}>
            <PlusIcon />
          </Link>
        ) : (
          <button
            type="button"
            className={plusClassName}
            aria-label={t.landing.addToCart}
            disabled={!addToCartLine}
            onClick={handleAddToCart}
          >
            <PlusIcon />
          </button>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${relaxed ? 'gap-5 md:gap-6' : 'gap-2 md:gap-2.5'}`}>
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 no-underline hover:underline">
            <h3 className="m-0 font-(family-name:--font-unbounded) text-xs font-medium break-words text-dark md:text-sm">
              {title}
            </h3>
          </Link>
          <span className="flex shrink-0 flex-col items-end">
            <span className="font-(family-name:--font-unbounded) text-xs font-light text-dark md:text-sm">
              {price}
            </span>
            {compareAt ? (
              <span className="text-[11px] leading-none text-dark/45 line-through md:text-xs">
                {compareAt}
              </span>
            ) : null}
          </span>
        </div>
        <Link
          href={href}
          className="mt-auto inline-flex min-h-8 w-fit max-w-full items-center justify-center whitespace-nowrap rounded-[8px] border border-black bg-transparent px-3 py-2 font-(family-name:--font-unbounded) text-[11px] font-normal text-dark no-underline transition-colors hover:bg-black hover:text-white sm:text-xs md:min-h-9 md:px-4 md:text-sm"
        >
          {ctaLabel ?? t.landing.showMore}
        </Link>
      </div>
    </article>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-5"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
