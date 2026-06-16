'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import AuthInput from '@/features/auth/ui/AuthInput/AuthInput';
import { extractApiError } from '@/features/auth/lib/apiError';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { saveUserEmail } from '@/features/auth/lib/userInitials';
import { useTranslation } from '@/i18n/useTranslation';
import {
  useLazyGetCurrentUserQuery,
  useLoginMutation,
} from '@/store/endpoints/authEndpoints';
import { setAuthEmail, setToken } from '@/store/slices/userSlice';

import googleLogo from '../../../../../public/icons/GoogleLogo.svg';
import facebookLogo from '../../../../../public/icons/FacebookLogo.svg';
import appleLogo from '../../../../../public/icons/AppleLogo.svg';
import styles from '../LoginForm/Login.module.scss';

type LoginFormProps = {
  initialEmail?: string;
  hintMessage?: string;
  hintType?: 'success' | 'error';
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
  onSuccess?: () => void;
};

export default function LoginForm({
  initialEmail = '',
  hintMessage = '',
  hintType = 'error',
  onCreateAccount,
  onForgotPassword,
  onSuccess,
}: LoginFormProps) {
  const { t, validators } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [fetchCurrentUser] = useLazyGetCurrentUserQuery();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const normalizedEmail = normalizeEmail(email);
    const errors = validators.validateLogin({ email: normalizedEmail, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const result = await login({
        email_or_phone: normalizedEmail,
        password,
      }).unwrap();
      saveUserEmail(normalizedEmail);
      localStorage.setItem('accessToken', result.access);
      localStorage.setItem('refreshToken', result.refresh);
      dispatch(setToken(result.access));
      dispatch(setAuthEmail(normalizedEmail));
      await fetchCurrentUser();
      onSuccess?.();
      router.push('/profile');
    } catch (error: unknown) {
      const detail = extractApiError(error) ?? '';

      if (detail.toLowerCase().includes('no active account')) {
        setErrorMessage(t.auth.errors.signInFailed);
      } else {
        setErrorMessage(detail || t.auth.errors.incorrectCredentials);
      }
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <p>{t.auth.login.welcome}</p>
          <p>{t.auth.login.subtitle}</p>
        </div>

        {hintMessage && (
          <div className={hintType === 'success' ? styles.successMessage : styles.errorMessage}>
            {hintMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.filed}>
            <AuthInput
              id="email"
              name="email"
              label={t.auth.labels.emailOrMobile}
              type="email"
              placeholder={t.auth.placeholders.email}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                const msg = validators.validateField('email', e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: msg }));
              }}
              error={fieldErrors.email}
            />
          </div>

          <div className={styles.filed}>
            <AuthInput
              id="password"
              name="password"
              label={t.auth.labels.password}
              type="password"
              placeholder={t.auth.placeholders.passwordDots}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                const msg = validators.validateField('password', e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: msg }));
              }}
              error={fieldErrors.password}
              togglePassword
            />
          </div>

          <div className={styles.optinalRow}>
            <label className={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className={styles.checkboxInput}
              />

              <span className={styles.checkIcon} aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  />
                </svg>
              </span>

              <span className={styles.checkboxLabel}>{t.auth.login.rememberMe}</span>
            </label>

            <button
              type="button"
              className={styles.forgBtn}
              onClick={onForgotPassword ?? (() => router.push('/get-code'))}
            >
              {t.auth.login.forgotPassword}
            </button>
          </div>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

          <button
            type="submit"
            disabled={!isChecked || isLoading}
            className={`${styles.loginBtn} transition-all duration-300 ease-in-out ${
              !isChecked || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? t.common.loading : t.auth.login.submit}
          </button>

          <div className="flex justify-center items-center gap-[24px] mt-[8px]">
            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={googleLogo} alt="Google" className="w-5 h-5" />
            </button>

            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={facebookLogo} alt="Facebook" className="w-5 h-5" />
            </button>

            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={appleLogo} alt="Apple" className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className={styles.registerVariant}>
          {onCreateAccount ? (
            <button type="button" className={styles.registerLink} onClick={onCreateAccount}>
              {t.auth.login.createAccount}
            </button>
          ) : (
            <Link href="/registration" className={styles.registerLink}>
              {t.auth.login.createAccount}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
