'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import AuthBootstrap from '@/features/auth/ui/AuthBootstrap';
import { I18nProvider } from '@/i18n/I18nProvider';
import { persistor, store } from '@/store/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nProvider>
          <AuthBootstrap />
          {children}
        </I18nProvider>
      </PersistGate>
    </Provider>
  );
}
