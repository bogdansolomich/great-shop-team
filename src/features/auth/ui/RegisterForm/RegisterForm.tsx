'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import AuthInput from '../AuthInput/AuthInput';
import { validateField, validateRegisterForm } from '@/features/auth/lib/validation';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { savePendingAuth } from '@/features/auth/lib/pendingAuth';
import { useRegisterUserMutation } from '@/store/endpoints/authEndpoints';

import googleLogo from '../../../../../public/icons/GoogleLogo.svg';
import facebookLogo from '../../../../../public/icons/FacebookLogo.svg';
import appleLogo from '../../../../../public/icons/AppleLogo.svg';
import styles from './Register.module.scss';

type RegisterFormProps = {
  onLogin?: () => void;
  onRegistered?: (email: string) => void;
};

export default function RegisterForm({ onLogin, onRegistered }: RegisterFormProps) {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [registerUser, { isSuccess, isLoading }] = useRegisterUserMutation();

  useEffect(() => {
    if (!isSuccess) return;

    savePendingAuth(formData.email, formData.password);

    if (onRegistered) {
      onRegistered(formData.email);
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
  }, [isSuccess, onRegistered, formData.email, formData.password, router]);

  const normalizeErrorData = (data: unknown): string[] => {
    if (typeof data === 'string') {
      return [data];
    }

    if (Array.isArray(data)) {
      return data.flatMap((item) => normalizeErrorData(item));
    }

    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).flatMap(([key, value]) => {
        const field = key === 'non_field_errors' ? '' : key.replace(/_/g, ' ');
        return normalizeErrorData(value).map((message) =>
          field ? `${field}: ${message}` : message,
        );
      });
    }

    return ['Registration error. Please check your details and try again..'];
  };

  const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError => {
    return typeof error === 'object' && error !== null && 'status' in error && 'data' in error;
  };

  const getErrorMessages = (error: unknown): string[] => {
    if (isFetchBaseQueryError(error)) {
      if (error.data) {
        return normalizeErrorData(error.data);
      }
      return ['Request error. Please try again later.'];
    }

    return ['Registration error. Please check your details and try again.'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);

    const errors = validateRegisterForm(formData, isChecked);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const email = normalizeEmail(formData.email);

    try {
      await registerUser({
        email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        accept_terms: isChecked,
      }).unwrap();
    } catch (error) {
      setErrorMessages(getErrorMessages(error));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    const msg = validateField(name, value, { ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    setErrorMessages([]);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.right}>
        <h1 className={styles.title}>Create New Account</h1>
        <h2 className={styles.subtitle}>Please enter details</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputContainer}>
            <AuthInput
              id="email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />
          </div>
          <div className={styles.inputContainer}>
            <AuthInput
              id="password"
              name="password"
              label="Password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              togglePassword
            />
          </div>
          <div className={styles.inputContainer}>
            <AuthInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
              togglePassword
            />
          </div>
          {errorMessages.length > 0 && (
            <div className={styles.errorMessage}>
              {errorMessages.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </div>
          )}
          <div className={`${styles.checkboxContainer} inline-flex flex-col gap-2`}>
            <div className="flex items-start gap-3">
              <label className="flex items-center cursor-pointer relative">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    setIsChecked(e.target.checked);
                    setFieldErrors((prev) => ({ ...prev, acceptTerms: '' }));
                  }}
                  className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-slate-800 checked:border-slate-800"
                  id="terms"
                />

                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
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
              </label>

              <label htmlFor="terms" className="text-sm cursor-pointer select-none">
                I agree to the{' '}
                <a href="/terms" className="font-semibold hover:text-gray-600 transition-colors">
                  Terms & Conditions
                </a>
              </label>
            </div>
            {fieldErrors.acceptTerms && (
              <p className="text-sm text-red-600">{fieldErrors.acceptTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isChecked || isLoading}
            className={`${styles.submitBtn} transition-all duration-300 ease-in-out ${
              !isChecked || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Loading...' : 'Signup'}
          </button>

          <div className="flex justify-center items-center gap-[24px]">
            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={googleLogo} alt="Google" className="w-6 h-6" />
            </button>

            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={facebookLogo} alt="Facebook" className="w-6 h-6" />
            </button>

            <button type="button" className="flex items-center justify-center w-10 h-10">
              <Image src={appleLogo} alt="Apple" className="w-6 h-6" />
            </button>
          </div>
        </form>
        <div className={styles.loginVariant}>
          Already have an account?{' '}
          {onLogin ? (
            <button type="button" className={styles.loginLink} onClick={onLogin}>
              Login
            </button>
          ) : (
            <Link href="/login" className={styles.loginLink}>
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
