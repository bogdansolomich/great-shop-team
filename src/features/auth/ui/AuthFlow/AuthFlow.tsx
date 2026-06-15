'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAutoLogin } from '@/features/auth/hooks/useAutoLogin';
import { normalizeEmail } from '@/features/auth/lib/normalizeEmail';
import { peekPendingAuth } from '@/features/auth/lib/pendingAuth';
import ForgotPasswordForm from '@/features/auth/ui/AuthPanel/ForgotPasswordForm'; 
import PasswordResetConfirmForm from '@/features/auth/ui/AuthPanel/PasswordResetConfirmForm'; 
import VerifyEmailForm from '@/features/auth/ui/AuthPanel/VerifyEmailForm';
import WelcomeAbroadPanel from '@/features/auth/ui/AuthPanel/WelcomeAbroadPanel';
import LoginForm from '@/features/auth/ui/LoginForm/LoginForm';
import RegisterForm from '@/features/auth/ui/RegisterForm/RegisterForm';

export type AuthView =
  | 'login'
  | 'register'
  | 'verify'
  | 'get-code'
  | 'reset-password-confirm'
  | 'welcome';

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
  
  const [loginHint, setLoginHint] = useState<{ text: string; type: 'success' | 'error' }>({
    text: '',
    type: 'error',
  });

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
      setLoginHint({
        text: 'Email verified. Sign in with the password you used during registration.',
        type: 'success',
      });
      onViewChange('welcome');
      return;
    }

    const pending = peekPendingAuth();
    setLoginEmail(pending?.email ?? normalizeEmail(verifyEmail));
    setLoginHint({
      text: 'Email verified. Sign in with the password you used during registration.',
      type: 'success',
    });
    onViewChange('login');
  }, [tryAutoLogin, onViewChange, verifyEmail]);

  const handleGetStarted = useCallback(async () => {
    if (!isAuthenticated) {
      const loggedIn = await tryAutoLogin();
      if (!loggedIn) {
        const pending = peekPendingAuth();
        setLoginEmail(pending?.email ?? normalizeEmail(verifyEmail));
        setLoginHint({
          text: 'Sign in with your email and password to continue.',
          type: 'error', 
        });
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
        hintMessage={loginHint.text} 
        hintType={loginHint.type}     
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
      <ForgotPasswordForm
        onBack={() => {
          setLoginHint({ text: '', type: 'error' }); 
          onViewChange('login');
        }}
        onCodeSent={(email) => {
          onVerifyEmailChange(email);
          onViewChange('reset-password-confirm'); 
        }}
        onLogin={onLogin ?? (() => onViewChange('login'))}
      />
    );
  }

  if (view === 'reset-password-confirm') {
    return (
      <PasswordResetConfirmForm
        email={verifyEmail}
        onBack={() => onViewChange('get-code')}
        onSuccess={() => {
          setLoginEmail(normalizeEmail(verifyEmail));
          setLoginHint({
            text: 'Password successfully reset! Please log in with your new password.',
            type: 'success', 
          });
          onViewChange('login'); 
        }}
      />
    );
  }

  if (view === 'verify') {
    return (
      <VerifyEmailForm
        email={verifyEmail}
        onBack={onVerifyBack ?? (() => onViewChange('register'))} 
        onVerified={handleVerified}
      />
    );
  }

  return <WelcomeAbroadPanel onGetStarted={handleGetStarted} />;
}