'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAutoLogin } from '@/features/auth/hooks/useAutoLogin';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { peekPendingAuth } from '@/features/auth/lib/pendingAuth';
import VerifyEmailForm from '@/features/auth/ui/AuthPanel/VerifyEmailForm';
import WelcomeAbroadPanel from '@/features/auth/ui/AuthPanel/WelcomeAbroadPanel';
import AuthShell from '@/features/auth/ui/AuthShell/AuthShell';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [verified, setVerified] = useState(false);
  const { isAuthenticated } = useAuth();
  const autoLogin = useAutoLogin();

  const tryAutoLogin = useCallback(async () => {
    const pending = peekPendingAuth();
    if (!pending) return false;

    try {
      await autoLogin(pending.email, pending.password);
      return true;
    } catch {
      return false;
    }
  }, [autoLogin]);

  const handleVerified = useCallback(async () => {
    const loggedIn = await tryAutoLogin();
    if (loggedIn) {
      setVerified(true);
      return;
    }

    const pending = peekPendingAuth();
    const loginEmail = pending?.email ?? normalizeEmail(email);
    router.push(
      `/login?email=${encodeURIComponent(loginEmail)}&verified=1`,
    );
  }, [tryAutoLogin, router, email]);

  const handleGetStarted = useCallback(async () => {
    if (!isAuthenticated) {
      const loggedIn = await tryAutoLogin();
      if (!loggedIn) {
        const pending = peekPendingAuth();
        const loginEmail = pending?.email ?? normalizeEmail(email);
        router.push(`/login?email=${encodeURIComponent(loginEmail)}`);
        return;
      }
    }
    router.push('/');
  }, [isAuthenticated, tryAutoLogin, router, email]);

  return (
    <AuthShell mode="page" onBackdropClick={() => router.push('/')}>
      {verified ? (
        <WelcomeAbroadPanel onGetStarted={handleGetStarted} />
      ) : (
        <VerifyEmailForm
          email={email}
          onBack={() => router.push('/get-code')}
          onVerified={handleVerified}
        />
      )}
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}
