'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import styles from '../LoginForm/Login.module.scss';
import { validateField, validateLogin } from '@/features/auth/validation';
import AuthInput from '../AuthInput/AuthInput';
import loginGirlImg from '../../../../../public/images/loginGirlImg.png';
import GoogleLogo from '../LoginForm/icon/GoogleIcon.png';
import AppleLogo from '../LoginForm/icon/AppleLogo.png';
import FaceLogo from '../LoginForm/icon/FaceBookLogo.png';
import { useLoginMutation } from '@/store/endpoints/authEndpoints';
import { setToken } from '@/store/slices/userSlice';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    // validate client-side first using shared helper
    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const result = await login({ email_or_phone: email, password }).unwrap();
      localStorage.setItem('accessToken', result.access);
      localStorage.setItem('refreshToken', result.refresh);
      dispatch(setToken(result.access));
      router.push('/profile');
    } catch (error) {
      setErrorMessage('Incorrect email or password. Try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Image src={loginGirlImg} alt="Shop Photo" fill style={{ objectFit: 'cover' }} />
      </div>

      <div className={styles.right}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <p>Welcome! 👋 </p>
            <p>Please login here</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.filed}>
              <AuthInput
                id="email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="robertfox@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const msg = validateField('email', e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: msg }));
                }}
                error={fieldErrors.email}
              />
            </div>

            <div className={styles.filed}>
              <AuthInput
                id="password"
                name="password"
                label="Password"
                type="password"
                placeholder="00000000"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  const msg = validateField('password', e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: msg }));
                }}
                error={fieldErrors.password}
                togglePassword
              />
            </div>

            <div className={styles.optinalRow}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span> Remember me</span>
              </label>

              <span className={styles.forgBtn}>Forgot Password?</span>
            </div>

            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

            <button type="submit" className={styles.loginBtn} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <span className={styles.createAccount}>
            <Image src={GoogleLogo} alt="Google" className="w-5 h-5" />
            <Image src={FaceLogo} alt="FaceBook" className="w-4 h-5" />
            <Image src={AppleLogo} alt="Apple" className="w-4 h-5" />
            <Link href="/registration">Create new account?</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
