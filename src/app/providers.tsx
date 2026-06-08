'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import AuthBootstrap from '@/features/auth/ui/AuthBootstrap';
import { persistor, store } from '@/store/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthBootstrap />
        {children}
      </PersistGate>
    </Provider>
  );
}
