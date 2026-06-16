'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/userSlice';
import { useTranslation } from '@/i18n/useTranslation';
import AuthFlow, { type AuthView } from '@/features/auth/ui/AuthFlow/AuthFlow';
import AuthShell from '@/features/auth/ui/AuthShell/AuthShell';
import { useSessionEmail } from '@/features/auth/hooks/useSessionEmail';
import { AUTH_OVERLAY_CLOSE_EVENT } from '@/widgets/Logo/Logo';

import styles from './MyAccount.module.scss';

export type { AuthView };

export default function MyAccount() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { hasSession, initials } = useSessionEmail();

  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<AuthView>('login');
  const [verifyEmail, setVerifyEmail] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const onLogoHome = () => close();
    window.addEventListener(AUTH_OVERLAY_CLOSE_EVENT, onLogoHome);
    return () => window.removeEventListener(AUTH_OVERLAY_CLOSE_EVENT, onLogoHome);
  }, [close]);

  const toggle = () => {
    if (hasSession && isAuthenticated) {
      router.push('/profile');
      return;
    }

    setOpen((prev) => {
      if (!prev) setView('login');
      return !prev;
    });
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const showInitials = hasSession && isAuthenticated && Boolean(initials);

  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="auth-overlay"
        aria-label={hasSession && isAuthenticated ? t.account.profile : t.account.account}
      >
        {showInitials ? (
          <span className={styles.initials} aria-hidden>
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

      {open &&
        mounted &&
        createPortal(
          <div id="auth-overlay">
            <AuthShell mode="overlay" onBackdropClick={close}>
              <AuthFlow
                view={view}
                verifyEmail={verifyEmail}
                onViewChange={setView}
                onVerifyEmailChange={setVerifyEmail}
                onLoginSuccess={close}
                onWelcomeComplete={close}
              />
            </AuthShell>
          </div>,
          document.body,
        )}
    </>
  );
}