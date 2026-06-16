'use client';

import Link from 'next/link';

import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/content/ui/InfoPage/InfoPage.module.scss';

type StubPageKey = 'wishlist' | 'cart';

type StubPageProps = {
  pageKey: StubPageKey;
};

export default function StubPage({ pageKey }: StubPageProps) {
  const { t } = useTranslation();
  const page = t.stub[pageKey];

  return (
    <article className={styles.page}>
      <Link href="/" className={styles.back}>
        {t.infoPage.backToHome}
      </Link>
      <h1 className={styles.title}>{page.title}</h1>
      <p className={styles.description}>{page.description}</p>
      <Link href="/catalog" className={styles.externalLink}>
        {page.cta}
      </Link>
    </article>
  );
}
