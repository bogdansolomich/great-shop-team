'use client';

import Image from 'next/image';
import { useState } from 'react';

import AuthInput from '@/features/auth/ui/AuthInput/AuthInput';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { validateField } from '@/features/auth/lib/validation';
import { useResetPasswordMutation } from '@/store/endpoints/authEndpoints'; 

import styles from './AuthPanel.module.scss';

type ForgotPasswordFormProps = {
  onBack?: () => void;
  onCodeSent: (email: string) => void; 
  onLogin: () => void;
};

export default function ForgotPasswordForm({ onBack, onCodeSent, onLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateField('email', email);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      await resetPassword({ email: normalizeEmail(email) }).unwrap();
      onCodeSent(email);
    } catch {
      setError('Could not send the reset code. Check your email and try again.');
    }
  };

  return (
    <div className={styles.root}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Back">
          ‹
        </button>
      )}

      <div className={styles.illustration}>
        <Image src="/images/float.jpg" alt="Forgot Password" width={150} height={150} priority />
      </div>

      <h1 className={styles.title}>Forgot Password?</h1>
      <p className={styles.subtitleLinkEmail}>
        Enter your email address and we&apos;ll send you a code to reset your password.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          id="forgot-email"
          name="email"
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(validateField('email', e.target.value));
          }}
          error={error}
        />

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset code'}
        </button>
      </form>

      <p className={styles.footerLink}>
        Remember your password?{' '}
        <button type="button" className={styles.linkButton} onClick={onLogin}>
          Login
        </button>
      </p>
    </div>
  );
}