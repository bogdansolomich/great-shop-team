'use client';

import { getStoredUserEmail, getUserInitials } from '@/features/auth/lib/userInitials';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useSessionEmail() {
  const { user, authEmail, isAuthenticated, token } = useAuth();

  const storedEmail = getStoredUserEmail();
  const hasToken =
    typeof window !== 'undefined' ? Boolean(localStorage.getItem('accessToken')) : false;

  const hasSession = isAuthenticated || Boolean(token) || hasToken;
  const email = user?.email || authEmail || storedEmail;

  return {
    email,
    hasSession,
    initials: getUserInitials(email),
  };
}
