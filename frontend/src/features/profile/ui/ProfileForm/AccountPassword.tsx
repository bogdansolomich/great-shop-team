'use client';

import { useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { useChangePasswordMutation } from '@/store/endpoints/authEndpoints';

const labelClass = 'mb-1.5 block text-sm text-dark/80';
const inputClass =
  'h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 pr-11 text-sm text-dark outline-none focus:border-black';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 3l18 18" />
        <path d="M10.5 10.5A2.5 2.5 0 0 0 13.5 13.5" />
        <path d="M9.1 5.18A10.8 10.8 0 0 1 12 5c5.4 0 9.79 3.44 11 7-1.08 3.1-3.74 5.71-7.12 6.82" />
        <path d="M6.12 6.12A16.95 16.95 0 0 0 2 12c1.31 3.31 4.48 6 10 7" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <label>
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <input
          className={inputClass}
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent text-dark/50"
          aria-label={visible ? t.common.hidePassword : t.common.showPassword}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}

export default function AccountPassword() {
  const { t } = useTranslation();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (form.new_password !== form.confirm_password) {
      setError(t.validation.passwordsDoNotMatch);
      return;
    }

    try {
      await changePassword(form).unwrap();
      setForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch {
      setError(t.common.error);
    }
  }

  return (
    <form className="rounded-xl border border-neutral-200 p-5 md:p-6" onSubmit={handleSubmit}>
      <h2 className="m-0 mb-5 text-lg font-medium text-dark">{t.account.changePassword}</h2>
      <div className="flex max-w-3xl flex-col gap-4">
        <PasswordField
          label={t.changePassword.currentPassword}
          name="old_password"
          autoComplete="current-password"
          placeholder={t.changePassword.EnterCurrentPassword}
          value={form.old_password}
          onChange={(value) => updateField('old_password', value)}
        />
        <PasswordField
          label={t.changePassword.NewPassword}
          name="new_password"
          autoComplete="new-password"
          placeholder={t.changePassword.MinCharacters}
          value={form.new_password}
          onChange={(value) => updateField('new_password', value)}
        />
        <PasswordField
          label={t.changePassword.ConfirmNewPassword}
          name="confirm_password"
          autoComplete="new-password"
          placeholder={t.changePassword.RepeatNewPassword}
          value={form.confirm_password}
          onChange={(value) => updateField('confirm_password', value)}
        />
      </div>
      {error ? <p className="mt-3 mb-0 text-sm text-[#C0392B]">{error}</p> : null}
      <button
        className="mx-auto mt-6 flex h-11 cursor-pointer items-center justify-center rounded-lg border-none bg-black px-8 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? t.common.saving : t.changePassword.SaveChanges}
      </button>
    </form>
  );
}
