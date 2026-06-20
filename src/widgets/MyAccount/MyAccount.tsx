'use client';

import { useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthOverlay } from '@/features/auth/context/AuthOverlayContext';
import { useSessionEmail } from '@/features/auth/hooks/useSessionEmail';
import { useTranslation } from '@/i18n/useTranslation';
import { selectIsAuthenticated } from '@/store/slices/userSlice';
import { getHeaderActionClass, isActivePath } from '@/widgets/Header/headerActionClasses';

export default function MyAccount({
  isHeaderTransparent = false,
}: {
  isHeaderTransparent?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { hasSession, initials } = useSessionEmail();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { isOpen, openAuth } = useAuthOverlay();

  const isActive = isActivePath(pathname, '/profile') || isOpen;

  const toggle = () => {
    if (hasSession && isAuthenticated) {
      router.push('/profile');
      return;
    }

    openAuth('login');
  };

  const showInitials = hasSession && isAuthenticated && Boolean(initials);

  return (
    <button
      type="button"
      className={`${getHeaderActionClass(isActive)} cursor-pointer border-x-0 border-t-0 bg-transparent [&_svg]:block`}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-controls="auth-overlay"
      aria-current={isActive ? 'page' : undefined}
      aria-label={hasSession && isAuthenticated ? t.account.profile : t.account.account}
    >
      {showInitials ? (
        <span
          className={`flex h-7 w-7 select-none items-center justify-center rounded-full font-(family-name:--font-unbounded) text-[11px] font-semibold leading-none tracking-wide ${
            isHeaderTransparent ? 'bg-white text-dark' : 'bg-dark text-white'
          }`}
          aria-hidden
        >
          {initials}
        </span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      )}
    </button>
  );
}
