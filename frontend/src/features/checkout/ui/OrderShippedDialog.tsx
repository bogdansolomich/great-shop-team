'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import NextImage from 'next/image';

type OrderShippedDialogProps = {
  open: boolean;
  title: string;
  sent: string;
  thanks: string;
  homeLabel: string;
};

export default function OrderShippedDialog({
  open,
  title,
  sent,
  thanks,
  homeLabel,
}: OrderShippedDialogProps) {
  const homeRef = useRef<HTMLAnchorElement>(null);
  const titleId = 'order-shipped-title';

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    homeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="animate-order-backdrop absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-order-modal relative flex h-[min(499px,calc(100dvh-32px))] w-[min(929px,calc(100vw-32px))] items-center justify-center bg-white-fa"
      >
        <div className="flex h-[min(335px,100%)] w-[min(575px,calc(100%-32px))] flex-col items-center justify-center text-center">
          <NextImage
            src="/images/bird-ok.png"
            alt=""
            width={110}
            height={83}
            className="h-20.75 w-27.5 object-contain"
          />
          <h2
            id={titleId}
            className="m-0 mt-3 font-heading text-[30px] leading-[1.2] font-semibold tracking-[0.05em] text-black"
          >
            {title}
          </h2>
          <p className="m-0 mt-3 font-heading text-[20px] leading-[1.45] font-normal tracking-[0.05em] text-black">
            {sent}
          </p>
          <p className="m-0 mt-1 font-heading text-[20px] leading-[1.45] font-medium tracking-[0.05em] text-black">
            {thanks}
          </p>
          <Link
            ref={homeRef}
            href="/"
            className="mt-5 inline-flex h-12.75 w-29.25 items-center justify-center rounded-[5px] bg-dark font-(family-name:--font-poppins) text-[16px] font-medium text-white-fa no-underline"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
