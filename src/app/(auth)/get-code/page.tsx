'use client';

import { useRouter } from 'next/navigation';

import GetVerifiedForm from '@/features/auth/ui/AuthPanel/GetVerifiedForm';
import AuthShell from '@/features/auth/ui/AuthShell/AuthShell';

export default function GetCodePage() {
  const router = useRouter();

  return (
    <AuthShell mode="page" onBackdropClick={() => router.push('/')}>
      <GetVerifiedForm
        onBack={() => router.push('/login')}
        onGetCode={(email) =>
          router.push(`/verify?email=${encodeURIComponent(email)}`)
        }
        onLogin={() => router.push('/login')}
      />
    </AuthShell>
  );
}
