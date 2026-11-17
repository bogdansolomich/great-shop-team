'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation'; // <-- 1. Импортируем роутер

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { getDictionary } from './dictionaries';
import type { Dictionary } from './locales/en';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const fromStorage = localStorage.getItem(LOCALE_COOKIE);
  if (fromStorage && isLocale(fromStorage)) {
    return fromStorage;
  }

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('uk')) {
    return 'uk';
  }

  return defaultLocale;
}

type LocaleStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Locale;
  getServerSnapshot: () => Locale;
  setLocale: (locale: Locale) => void;
};

// 2. Передаем функцию refresh внутрь стора или вызываем ее
function createLocaleStore(serverLocale: Locale, onLocaleChange?: () => void): LocaleStore {
  let locale = serverLocale;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      if (typeof window !== 'undefined') {
        locale = readStoredLocale();
      }
      return locale;
    },
    getServerSnapshot() {
      return serverLocale;
    },
    setLocale(next) {
      locale = next;

      // Сохраняем локаль
      localStorage.setItem(LOCALE_COOKIE, next);
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = next;

      listeners.forEach((listener) => listener());

      // 3. Вызываем обновление серверных компонентов Next.js
      if (onLocaleChange) {
        onLocaleChange();
      }
    },
  };
}

type I18nProviderProps = {
  children: ReactNode;
  initialLocale?: Locale;
};

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const router = useRouter(); // <-- 4. Получаем роутер Next.js
  const serverLocale = initialLocale ?? defaultLocale;

  // 5. Передаем router.refresh в стор
  const [localeStore] = useState(() =>
    createLocaleStore(serverLocale, () => {
      router.refresh();
    }),
  );

  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );

  const setLocale = useCallback(
    (next: Locale) => {
      localeStore.setLocale(next);
    },
    [localeStore],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: getDictionary(locale),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
