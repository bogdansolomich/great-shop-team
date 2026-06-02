'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import styles from './Register.module.scss';
import { validateField, validateForm } from '@/features/auth/validation';
import AuthInput from '../AuthInput/AuthInput';
import poster from '../../../../../public/images/boyRegister.jpg';
import googleLogo from '../../../../../public/icons/GoogleLogo.svg';
import facebookLogo from '../../../../../public/icons/FacebookLogo.svg';
import appleLogo from '../../../../../public/icons/AppleLogo.svg';
import { useRegisterUserMutation } from '@/store/endpoints/authEndpoints';

export default function RegisterForm() {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerUser, { isSuccess, isLoading }] = useRegisterUserMutation();

  useEffect(() => {
    if (isSuccess) {
      setIsModalOpen(true);
    }
  }, [isSuccess]);

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

    const errors = validateForm(formData, isChecked);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        accept_terms: isChecked,
      }).unwrap();
    } catch (error) {
      setErrorMessages(getErrorMessages(error));
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push('/login');
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
    <div className={styles.container}>
      <div className={styles.left}>
        <Image src={poster} alt="Shop Photo" layout="fill" objectFit="cover" priority />
      </div>

      <div className={styles.right}>
        <h1 className={styles.title}>Create New Account</h1>
        <h2 className={styles.subtitle}>Please enter details</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputContainer}>
            <AuthInput
              id="firstName"
              name="firstName"
              label="First Name"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              error={fieldErrors.firstName}
            />
          </div>
          <div className={styles.inputContainer}>
            <AuthInput
              id="lastName"
              name="lastName"
              label="Last Name"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              error={fieldErrors.lastName}
            />
          </div>
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
                <a href="/terms" className="underline">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="underline">
                  Privacy Policy
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
            {isLoading ? 'Loading...' : 'Register'}
          </button>
        </form>
        <div className="flex justify-center items-center gap-[36px] mt-[30px]">
          <button className="flex items-center justify-center w-12 h-12">
            <Image src={googleLogo} alt="Google" className="w-8 h-8" />
          </button>

          <button className="flex items-center justify-center w-12 h-12">
            <Image src={facebookLogo} alt="Facebook" className="w-8 h-8" />
          </button>

          <button className="flex items-center justify-center w-12 h-12">
            <Image src={appleLogo} alt="Apple" className="w-8 h-8" />
          </button>
        </div>

        <div className={styles.loginVariant}>
          Already have an account?{' '}
          <a href="/login" className={styles.loginLink}>
            Login
          </a>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center animate-fade-in">
            {/* Просто SVG-иконка из папки ассетов без круга */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-3xl">
              📧
            </div>

            <h3 className="text-xl font-semibold text-gray-900">Check your email</h3>
            <p className="mt-2 text-sm text-gray-500">
              An email has been sent to you at{' '}
              <span className="font-semibold text-gray-900">{formData.email}</span>. Click on the
              link to access your account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
