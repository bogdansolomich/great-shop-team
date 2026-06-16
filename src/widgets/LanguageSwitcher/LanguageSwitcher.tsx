'use client';

import { localeLabels, locales, type Locale } from '@/i18n/config';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './LanguageSwitcher.module.scss';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className={styles.switcher} role="group" aria-label={t.common.language}>
      {locales.map((code, index) => (
        <span key={code} className={styles.item}>
          {index > 0 ? <span className={styles.divider} aria-hidden>/</span> : null}
          <button
            type="button"
            className={`${styles.button} ${locale === code ? styles.active : ''}`}
            onClick={() => setLocale(code as Locale)}
            aria-pressed={locale === code}
            aria-label={code === 'uk' ? t.common.ukrainian : t.common.english}
          >
            {localeLabels[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
