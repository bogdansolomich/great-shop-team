'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';

import styles from './AuthPanel.module.scss';

type WelcomeAbroadPanelProps = {
  onGetStarted: () => void | Promise<void>;
};

export default function WelcomeAbroadPanel({ onGetStarted }: WelcomeAbroadPanelProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onGetStarted();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>{t.auth.welcome.title}</h1>
      <p className={styles.subtitleLinkEmail}>{t.auth.welcome.subtitle}</p>

      <div className={styles.illustration} aria-hidden>
        <Image
          src="/images/Illustration - dancing.jpg"
          alt={t.auth.welcome.imageAlt}
          width={280}
          height={300}
          priority
        />
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? t.auth.welcome.signingIn : t.auth.welcome.submit}
      </button>

      <p className={styles.welcomeFooter}>
        {t.auth.welcome.goShopping}{' '}
        <Link href="/catalog" className={styles.linkButton}>
          {t.common.catalog}
        </Link>
      </p>
    </div>
  );
}
