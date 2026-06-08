'use client';

import Image from 'next/image';
import { useState } from 'react';

import AuthInput from '@/features/auth/ui/AuthInput/AuthInput';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { validateField } from '@/features/auth/lib/validation';
import { useResendActivationCodeMutation } from '@/store/endpoints/authEndpoints';

import styles from './AuthPanel.module.scss';

type GetVerifiedFormProps = {
  onBack?: () => void;
  onGetCode: (email: string) => void;
  onLogin: () => void;
};

export default function GetVerifiedForm({ onBack, onGetCode, onLogin }: GetVerifiedFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [resendCode, { isLoading }] = useResendActivationCodeMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateField('email', email);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      await resendCode({ email: normalizeEmail(email) }).unwrap();
      onGetCode(email);
    } catch {
      setError('Could not send the code. Check your email and try again.');
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
        <Image src="/images/float.jpg" alt="Get Verified" width={180} height={180} priority />
      </div>

      <h1 className={styles.title}>Let&apos;s get you verified</h1>
      <p className={styles.subtitleLinkEmail}>The code will be sent to your email</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          id="verify-email"
          name="email"
          label="Email Address/Mobile"
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
          {isLoading ? 'Sending...' : 'Get code'}
        </button>
      </form>

      <p className={styles.footerLink}>
        Already have an account?
        <button type="button" className={styles.linkButton} onClick={onLogin}>
          Login
        </button>
      </p>
    </div>
  );
}
