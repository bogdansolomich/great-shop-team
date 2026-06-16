'use client';

import { useState } from 'react';

import { validateEmail } from '@/features/auth/lib/validation';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './NewsletterForm.module.scss';

export default function NewsletterForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showSubmit = email.trim().length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = email.trim();
    if (!validateEmail(value)) {
      setMessage(t.newsletter.invalidEmail);
      setIsError(true);
      return;
    }

    setMessage(t.newsletter.success);
    setIsError(false);
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
       {message ? (
        <p className={`${styles.message} ${isError ? styles.messageError : styles.messageSuccess}`}>
          {message}
        </p>
      ) : null}
      
      <div className={styles.field}>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (message) {
              setMessage('');
              setIsError(false);
            }
          }}
          placeholder="you@email.com"
          autoComplete="email"
          className={styles.input}
        />

        {showSubmit ? (
          <button type="submit" aria-label={t.footer.subscribeAria} className={styles.submit}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.icon}
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
        ) : null}
      </div>

     
    </form>
  );
}
