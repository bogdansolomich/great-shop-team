'use client';

import Link from 'next/link';

import type { InfoPageSlug } from '@/features/content/lib/infoPages';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';

import styles from './InfoPage.module.scss';

const externalUrls: Partial<Record<InfoPageSlug, string>> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/',
};

type InfoPageProps = {
  slug: InfoPageSlug;
};

export default function InfoPage({ slug }: InfoPageProps) {
  const { t } = useTranslation();
  const page = t.infoPages[slug];
  const externalUrl = externalUrls[slug];

  return (
    <article className={styles.page}>
      <Link href="/" className={styles.back}>
        {t.infoPage.backToHome}
      </Link>
      <h1 className={styles.title}>{page.title}</h1>
      <p className={styles.description}>{page.description}</p>
      {externalUrl ? (
        <a href={externalUrl} className={styles.externalLink} target="_blank" rel="noopener noreferrer">
          {formatMessage(t.infoPage.open, { title: page.title })}
        </a>
      ) : null}
    </article>
  );
}
