'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { HiOutlineClipboardDocumentList, HiOutlineCube } from 'react-icons/hi2';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionEmail } from '@/features/auth/hooks/useSessionEmail';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetCurrentProfileQuery } from '@/store/endpoints/profilesEndpoints';
import { headerBarTextClass } from '@/widgets/Header/headerActionClasses';
import LanguageSwitcher from '@/widgets/LanguageSwitcher/LanguageSwitcher';
import BrandLogo from '@/widgets/Logo/BrandLogo';

import { clearAdminPreview, isAdminPreview } from './adminPreview';
import {
  ADMIN_PROFILE_NAME_EVENT,
  ADMIN_PROFILE_PHOTO_EVENT,
  profileDisplayName,
  profileImageSrc,
  readStoredProfilePhoto,
} from './adminProfileIdentity';
import { isAdminUser } from './isAdminUser';

type AdminShellProps = {
  children: ReactNode;
};

function sectionActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: AdminShellProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, user, logoutUser } = useAuth();
  const { hasSession, email } = useSessionEmail();
  const hasToken =
    typeof window !== 'undefined'
      ? Boolean(token) || Boolean(localStorage.getItem('accessToken'))
      : Boolean(token);
  const signedIn = isAuthenticated || hasSession || hasToken;
  const identityReady = Boolean(email) || Boolean(user);
  const isAdmin = isAdminUser(user, email);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isAdminPreview() || isAdmin) {
      return;
    }

    if (!signedIn) {
      router.replace('/');
      return;
    }

    if (identityReady && !isAdmin) {
      router.replace('/profile');
    }
  }, [identityReady, isAdmin, router, signedIn]);

  if (!isAdminPreview() && !isAdmin) return null;

  const dashboardActive = pathname === '/admin';
  const productsActive = sectionActive(pathname, '/admin/products');
  const ordersActive = sectionActive(pathname, '/admin/orders');

  function exitAdmin() {
    clearAdminPreview();
    logoutUser();
    window.location.replace('/');
  }

  return (
    <div className="min-h-dvh bg-white text-dark lg:flex lg:h-dvh lg:overflow-hidden">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-neutral-200 bg-white pb-6 lg:flex">
        <Link
          href="/admin"
          className="mb-5 flex h-14 items-center border-b border-neutral-200 px-6 text-black no-underline"
        >
          <BrandLogo />
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pt-4" aria-label={t.admin.open}>
          <Link
            href="/admin"
            aria-current={dashboardActive ? 'page' : undefined}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline ${
              dashboardActive
                ? 'bg-black font-semibold text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
            }`}
          >
            <HomeIcon />
            {t.admin.dashboard}
          </Link>

          <Link
            href="/admin/products"
            aria-current={productsActive ? 'page' : undefined}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline ${
              productsActive
                ? 'bg-black font-semibold text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
            }`}
          >
            <HiOutlineCube className="size-5 shrink-0" aria-hidden />
            {t.admin.products}
          </Link>

          <Link
            href="/admin/orders"
            aria-current={ordersActive ? 'page' : undefined}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline ${
              ordersActive
                ? 'bg-black font-semibold text-white'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
            }`}
          >
            <HiOutlineClipboardDocumentList className="size-5 shrink-0" aria-hidden />
            {t.admin.orders}
          </Link>

          <button
            type="button"
            onClick={exitAdmin}
            className="mt-5 flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <ExitIcon />
            {t.admin.logout}
          </button>
        </nav>

        <div className="mt-auto border-t border-neutral-200 px-4 pt-4">
          <AdminAccountLink pathname={pathname} email={email} signedIn={signedIn} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:flex lg:flex-col">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/admin" className="shrink-0 text-black no-underline lg:hidden">
              <BrandLogo />
            </Link>
            <div
              className={`ml-auto flex items-center gap-3 text-black sm:gap-6 ${headerBarTextClass}`}
            >
              <button
                type="button"
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-black sm:hidden"
                aria-label={mobileNavOpen ? t.nav.closeMenu : t.nav.openMenu}
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <MenuIcon open={mobileNavOpen} />
              </button>
              <Link
                href="/"
                aria-label={t.admin.toStore}
                className="inline-flex size-10 items-center justify-center text-inherit no-underline"
              >
                <PersonIcon className="size-6" />
              </Link>
              <div aria-hidden className="hidden h-8 w-px shrink-0 bg-neutral-300 sm:block" />
              <LanguageSwitcher variant="dropdown" />
            </div>
          </div>
          {mobileNavOpen ? (
            <nav
              className="grid gap-1 border-t border-neutral-200 px-4 py-3 sm:hidden"
              aria-label={t.admin.open}
            >
              <MobileNavLink
                href="/admin"
                active={dashboardActive}
                onNavigate={() => setMobileNavOpen(false)}
              >
                {t.admin.dashboard}
              </MobileNavLink>
              <MobileNavLink
                href="/admin/products"
                active={productsActive}
                onNavigate={() => setMobileNavOpen(false)}
              >
                <HiOutlineCube className="size-5 shrink-0" aria-hidden />
                {t.admin.products}
              </MobileNavLink>
              <MobileNavLink
                href="/admin/orders"
                active={ordersActive}
                onNavigate={() => setMobileNavOpen(false)}
              >
                <HiOutlineClipboardDocumentList className="size-5 shrink-0" aria-hidden />
                {t.admin.orders}
              </MobileNavLink>
              <div className="mt-2">
                <AdminAccountLink pathname={pathname} email={email} signedIn={signedIn} />
              </div>
              <button
                type="button"
                onClick={exitAdmin}
                className="mt-2 flex h-11 cursor-pointer items-center gap-3 rounded-full border-0 bg-transparent px-4 text-sm font-semibold text-red-600"
              >
                <ExitIcon />
                {t.admin.logout}
              </button>
            </nav>
          ) : null}
        </header>
        <div className="px-4 py-5 sm:px-6 sm:py-7 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminAccountLink({
  pathname,
  email,
  signedIn,
}: {
  pathname: string;
  email: string;
  signedIn: boolean;
}) {
  const { t } = useTranslation();
  const profile = useGetCurrentProfileQuery(undefined, { skip: !signedIn });
  const profileId = profile.data?.id ?? null;
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [storedPhoto, setStoredPhoto] = useState('');

  useEffect(() => {
    setStoredPhoto(readStoredProfilePhoto(profileId));
  }, [profileId]);

  useEffect(() => {
    function onName(event: Event) {
      setDraftName((event as CustomEvent<string | null>).detail);
    }
    function onPhoto(event: Event) {
      setDraftPhoto((event as CustomEvent<string | null>).detail);
      setStoredPhoto(readStoredProfilePhoto(profileId));
    }
    window.addEventListener(ADMIN_PROFILE_NAME_EVENT, onName);
    window.addEventListener(ADMIN_PROFILE_PHOTO_EVENT, onPhoto);
    return () => {
      window.removeEventListener(ADMIN_PROFILE_NAME_EVENT, onName);
      window.removeEventListener(ADMIN_PROFILE_PHOTO_EVENT, onPhoto);
    };
  }, [profileId]);

  const savedName = profileDisplayName(profile.data);
  const name = (draftName ?? savedName).trim() || 'Admin';
  const photo = draftPhoto || profileImageSrc(profile.data) || storedPhoto;
  const subtitle = profile.data?.user?.email || email || t.admin.role;

  return (
    <Link
      href="/admin/profile"
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-black no-underline transition-colors ${
        pathname === '/admin/profile'
          ? 'border-black bg-neutral-50'
          : 'border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-700">
        {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <PersonIcon />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
      </span>
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-sm no-underline ${
        active ? 'bg-black font-semibold text-white' : 'text-neutral-700 hover:bg-neutral-100'
      }`}
    >
      {children}
    </Link>
  );
}

function ExitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5M15 12H3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      />
    </svg>
  );
}

function PersonIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3" />
      <path strokeLinecap="round" d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}
