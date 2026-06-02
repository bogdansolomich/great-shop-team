'use client';

import { ChangeEvent, useState } from 'react';
import styles from './AuthInput.module.scss';

type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'search' | 'url';

interface AuthInputProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type?: InputType;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  togglePassword?: boolean;
}

export default function AuthInput({
  id,
  name,
  label,
  placeholder = '',
  type = 'text',
  value,
  onChange,
  error,
  hint,
  togglePassword = false,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === 'password' && togglePassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.inputWrapper} ${error ? styles.inputWrapperError : ''}`}>
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles.inputField}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {togglePassword && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className={styles.toggleButton}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.64 21.64 0 015.15-6.13" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p id={`${id}-error`} className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
