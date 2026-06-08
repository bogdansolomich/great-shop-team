'use client';

import { useEffect } from 'react';

import styles from './AuthShell.module.scss';

type AuthShellProps = {
  children: React.ReactNode;
  mode?: 'overlay' | 'page';
  onBackdropClick?: () => void;
};

export default function AuthShell({
  children,
  mode = 'overlay',
  onBackdropClick,
}: AuthShellProps) {
  useEffect(() => {
    if (mode !== 'overlay') return undefined;

    document.body.classList.add('auth-overlay-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.classList.remove('auth-overlay-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mode]);

  return (
    <div
      className={`${styles.shell} ${mode === 'page' ? styles.page : styles.overlay}`}
      role={mode === 'overlay' ? 'dialog' : undefined}
      aria-modal={mode === 'overlay' ? true : undefined}
      aria-label={mode === 'overlay' ? 'Account' : undefined}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close"
        onClick={onBackdropClick}
      />
      <div className={styles.panel}>{children}</div>
    </div>
  );
}
