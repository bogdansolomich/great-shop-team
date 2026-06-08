'use client';

import Image from 'next/image';
import Link from 'next/link';

export const AUTH_OVERLAY_CLOSE_EVENT = 'auth-overlay-close';

export default function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center"
      aria-label="WEARLY — на главную"
      onClick={() => window.dispatchEvent(new CustomEvent(AUTH_OVERLAY_CLOSE_EVENT))}
    >
      <Image src="/icons/Logo.svg" alt="WEARLY" width={132} height={30} priority />
    </Link>
  );
}
