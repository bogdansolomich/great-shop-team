'use client';

import { useEffect } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

type LoginRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

export default function LoginRequiredModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
}: LoginRequiredModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="login-required-title"
        className="relative max-h-[90dvh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white px-4 py-5 shadow-xl sm:px-6 sm:py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-2xl leading-none text-black/70 transition-colors hover:text-black"
          onClick={onClose}
          aria-label={t.wishlist.closeModal}
        >
          ×
        </button>

        <h2
          id="login-required-title"
          className="mb-3 pr-10 font-(family-name:--font-unbounded) text-xl font-bold text-black sm:mb-4 sm:text-2xl"
        >
          {t.wishlist.loginRequiredTitle}
        </h2>

        <p className="mb-6 text-base leading-relaxed text-black/80 sm:mb-8">
          {t.wishlist.loginRequiredText}
        </p>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] border border-black bg-black px-4 text-sm font-medium tracking-wide text-white uppercase transition-opacity hover:opacity-90"
            onClick={onLogin}
          >
            {t.wishlist.loginButton}
          </button>
          <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] border border-black bg-white px-4 text-sm font-medium tracking-wide text-black uppercase transition-colors hover:bg-black/5"
            onClick={onRegister}
          >
            {t.wishlist.registerButton}
          </button>
        </div>
      </div>
    </div>
  );
}
