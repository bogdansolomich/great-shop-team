'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import styles from './AuthPanel.module.scss';

type WelcomeAbroadPanelProps = {
  onGetStarted: () => void | Promise<void>;
};

export default function WelcomeAbroadPanel({ onGetStarted }: WelcomeAbroadPanelProps) {
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
      <h1 className={styles.title}>Welcome Abroad</h1>
      <p className={styles.subtitleLinkEmail}>We&apos;ve please enter the code below</p>

        <div className={styles.illustration} aria-hidden>
          <Image src="/images/Illustration - dancing.jpg" alt="Welcome Abroad" width={280} height={300} priority />
        </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Get Started'}
      </button>

      <p className={styles.welcomeFooter}>
        Do to shopping?{' '}
        <Link href="/" className={styles.linkButton}>
          Catalog
        </Link>
      </p>
    </div>
  );
}
