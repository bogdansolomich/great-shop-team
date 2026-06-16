'use client';

import Image from 'next/image';
import { useState } from 'react';

import AuthInput from '@/features/auth/ui/AuthInput/AuthInput';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { useTranslation } from '@/i18n/useTranslation';
import { useResetPasswordMutation } from '@/store/endpoints/authEndpoints';

import styles from './AuthPanel.module.scss';

type ForgotPasswordFormProps = {
  onBack?: () => void;
  onCodeSent: (email: string) => void;
  onLogin: () => void;
};

export default function ForgotPasswordForm({ onBack, onCodeSent, onLogin }: ForgotPasswordFormProps) {
  const { t, validators } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validators.validateField('email', email);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      await resetPassword({ email: normalizeEmail(email) }).unwrap();
      onCodeSent(email);
    } catch {
      setError(t.auth.errors.resetCodeFailed);
    }
  };

  return (
    <div className={styles.root}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack} aria-label={t.common.back}>
          ‹
        </button>
      )}

      <div className={styles.illustration}>
        <Image
          src="/images/float.jpg"
          alt={t.auth.forgotPassword.imageAlt}
          width={150}
          height={150}
          priority
        />
      </div>

      <h1 className={styles.title}>{t.auth.forgotPassword.title}</h1>
      <p className={styles.subtitleLinkEmail}>{t.auth.forgotPassword.subtitle}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          id="forgot-email"
          name="email"
          label={t.auth.labels.email}
          type="email"
          placeholder={t.auth.placeholders.email}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(validators.validateField('email', e.target.value));
          }}
          error={error}
        />

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? t.common.sending : t.auth.forgotPassword.submit}
        </button>
      </form>

      <p className={styles.footerLink}>
        {t.auth.forgotPassword.rememberPassword}{' '}
        <button type="button" className={styles.linkButton} onClick={onLogin}>
          {t.auth.login.submit}
        </button>
      </p>
    </div>
  );
}
