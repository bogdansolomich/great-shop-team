'use client';

import { useRouter } from 'next/navigation';

import AuthShell from '@/features/auth/ui/AuthShell/AuthShell';
import RegisterForm from '@/features/auth/ui/RegisterForm/RegisterForm';

export default function RegistrationPage() {
  const router = useRouter();

  return (
    <AuthShell mode="page" onBackdropClick={() => router.push('/')}>
      <RegisterForm
        onLogin={() => router.push('/login')}
        onRegistered={(email) =>
          router.push(`/verify?email=${encodeURIComponent(email)}`)
        }
      />
    </AuthShell>
  );
}
