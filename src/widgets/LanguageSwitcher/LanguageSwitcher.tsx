'use client';

import { localeLabels, locales, type Locale } from '@/i18n/config';
import { useTranslation } from '@/i18n/useTranslation';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase"
      role="group"
      aria-label={t.common.language}
    >
      {locales.map((code, index) => (
        <span key={code} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span className="opacity-40 select-none" aria-hidden>
              /
            </span>
          ) : null}
          <button
            type="button"
            className={`cursor-pointer border-none bg-transparent px-0 py-1 text-inherit underline decoration-transparent transition-[text-decoration-color,opacity] duration-300 ease-in-out hover:decoration-inherit ${
              locale === code ? 'decoration-inherit' : ''
            }`}
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
