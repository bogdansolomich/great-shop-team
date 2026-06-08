'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthShell from '@/features/auth/ui/AuthShell/AuthShell';
import LoginForm from '@/features/auth/ui/LoginForm/LoginForm';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';
  const verified = searchParams.get('verified') === '1';

  return (
    <AuthShell mode="page" onBackdropClick={() => router.push('/')}>
      <LoginForm
        initialEmail={initialEmail}
        hintMessage={
          verified
            ? 'Email verified. Sign in with the password you used during registration.'
            : ''
        }
        onCreateAccount={() => router.push('/registration')}
        onForgotPassword={() => router.push('/get-code')}
        onSuccess={() => router.push('/profile')}
      />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
