'use client';

import Link from 'next/link';

import { AUTH_OVERLAY_CLOSE_EVENT } from '@/features/auth/lib/authOverlayEvents';
import BrandLogo from '@/widgets/Logo/BrandLogo';

export default function Logo() {
  return (
    <Link
      href="/"
      className="header-logo inline-flex items-center"
      aria-label="WEARLY — на главную"
      onClick={() => window.dispatchEvent(new CustomEvent(AUTH_OVERLAY_CLOSE_EVENT))}
    >
      <BrandLogo />
    </Link>
  );
}
