'use client';

import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import AuthOverlayProvider from '@/features/auth/context/AuthOverlayProvider';
import AuthBootstrap from '@/features/auth/ui/AuthBootstrap';
import { I18nProvider } from '@/i18n/I18nProvider';
import { persistor, store } from '@/store/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nProvider>
          <AuthBootstrap />
          <Suspense fallback={null}>
            <AuthOverlayProvider>{children}</AuthOverlayProvider>
          </Suspense>
        </I18nProvider>
      </PersistGate>
    </Provider>
  );
}
