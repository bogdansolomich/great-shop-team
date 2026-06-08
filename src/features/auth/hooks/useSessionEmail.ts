'use client';

import { useEffect, useState } from 'react';

import { getStoredUserEmail, getUserInitials } from '@/features/auth/lib/userInitials';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useSessionEmail() {
  const { user, authEmail, isAuthenticated, token } = useAuth();
  const [storedEmail, setStoredEmail] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setStoredEmail(getStoredUserEmail());
    setHasToken(Boolean(localStorage.getItem('accessToken')));
  }, [authEmail, user?.email]);

  const email = user?.email ?? authEmail ?? storedEmail;
  const hasSession = isAuthenticated || Boolean(token) || hasToken;

  return {
    email,
    hasSession,
    initials: getUserInitials(email),
  };
}
