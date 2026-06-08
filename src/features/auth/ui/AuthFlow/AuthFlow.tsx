'use client';

import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAutoLogin } from '@/features/auth/hooks/useAutoLogin';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { peekPendingAuth } from '@/features/auth/lib/pendingAuth';
import GetVerifiedForm from '@/features/auth/ui/AuthPanel/GetVerifiedForm';
import VerifyEmailForm from '@/features/auth/ui/AuthPanel/VerifyEmailForm';
import WelcomeAbroadPanel from '@/features/auth/ui/AuthPanel/WelcomeAbroadPanel';
import LoginForm from '@/features/auth/ui/LoginForm/LoginForm';
import RegisterForm from '@/features/auth/ui/RegisterForm/RegisterForm';

export type AuthView = 'login' | 'register' | 'verify' | 'get-code' | 'welcome';

type AuthFlowProps = {
  view: AuthView;
  verifyEmail: string;
  onViewChange: (view: AuthView) => void;
  onVerifyEmailChange: (email: string) => void;
  onLoginSuccess?: () => void;
  onWelcomeComplete?: () => void;
  onCreateAccount?: () => void;
  onLogin?: () => void;
  onForgotPassword?: () => void;
  onVerifyBack?: () => void;
};

export default function AuthFlow({
  view,
  verifyEmail,
  onViewChange,
  onVerifyEmailChange,
  onLoginSuccess,
  onWelcomeComplete,
  onCreateAccount,
  onLogin,
  onForgotPassword,
  onVerifyBack,
}: AuthFlowProps) {
  const { isAuthenticated } = useAuth();
  const autoLogin = useAutoLogin();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginHint, setLoginHint] = useState('');

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
      setLoginHint('');
      onViewChange('welcome');
      return;
    }

    const pending = peekPendingAuth();
    setLoginEmail(pending?.email ?? normalizeEmail(verifyEmail));
    setLoginHint('Email verified. Sign in with the password you used during registration.');
    onViewChange('login');
  }, [tryAutoLogin, onViewChange, verifyEmail]);

  const handleGetStarted = useCallback(async () => {
    if (!isAuthenticated) {
      const loggedIn = await tryAutoLogin();
      if (!loggedIn) {
        const pending = peekPendingAuth();
        setLoginEmail(pending?.email ?? normalizeEmail(verifyEmail));
        setLoginHint('Sign in with your email and password to continue.');
        onViewChange('login');
        return;
      }
    }
    onWelcomeComplete?.();
  }, [isAuthenticated, tryAutoLogin, onViewChange, onWelcomeComplete, verifyEmail]);

  if (view === 'login') {
    return (
      <LoginForm
        initialEmail={loginEmail}
        hintMessage={loginHint}
        onCreateAccount={onCreateAccount ?? (() => onViewChange('register'))}
        onForgotPassword={onForgotPassword ?? (() => onViewChange('get-code'))}
        onSuccess={onLoginSuccess}
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterForm
        onLogin={onLogin ?? (() => onViewChange('login'))}
        onRegistered={(email) => {
          onVerifyEmailChange(email);
          onViewChange('verify');
        }}
      />
    );
  }

  if (view === 'get-code') {
    return (
      <GetVerifiedForm
        onBack={() => onViewChange('login')}
        onGetCode={(email) => {
          onVerifyEmailChange(email);
          onViewChange('verify');
        }}
        onLogin={onLogin ?? (() => onViewChange('login'))}
      />
    );
  }

  if (view === 'verify') {
    return (
      <VerifyEmailForm
        email={verifyEmail}
        onBack={onVerifyBack ?? (() => onViewChange('get-code'))}
        onVerified={handleVerified}
      />
    );
  }

  return <WelcomeAbroadPanel onGetStarted={handleGetStarted} />;
}
