'use client';

import { FormEvent, useEffect, useState } from 'react';

import { adminButton } from '@/app/admin/adminClasses';
import { phoneCountries, splitPhoneNumber } from '@/features/checkout/lib/phoneCountries';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionEmail } from '@/features/auth/hooks/useSessionEmail';
import { useTranslation } from '@/i18n/useTranslation';
import PhoneNumberField from '@/shared/PhoneNumberField';
import {
  useGetCurrentProfileQuery,
  usePatchProfileMutation,
  usePatchProfilePhotoMutation,
} from '@/store/endpoints/profilesEndpoints';
import type { Profile, ProfileUpdateInput } from '@/store/types';

import {
  profileImageSrc,
  publishAdminProfileName,
  publishAdminProfilePhoto,
  readStoredProfilePhoto,
  rememberProfilePhoto,
} from './adminProfileIdentity';
import { formErrorText } from './formError';

const labelClass = 'mb-1.5 block text-sm text-dark/80';
const inputClass =
  'h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-dark outline-none focus:border-black';
const phoneInputClass =
  'flex h-11 min-w-0 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3';
const cardClass = 'rounded-xl border border-neutral-200 p-5 md:p-6';

type ProfileFormState = {
  first_name: string;
  last_name: string;
  phone: string;
  phoneIso: string;
};

function profileToForm(profile: Profile): ProfileFormState {
  const phone = splitPhoneNumber(profile.phone ?? '');
  return {
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: phone.nationalNumber,
    phoneIso: phone.countryIso,
  };
}

function ProfileFields({
  initial,
  initialPhoto,
  profileId,
  email,
}: {
  initial: ProfileFormState;
  initialPhoto: string;
  profileId: number | null;
  email: string;
}) {
  const { t, locale } = useTranslation();
  const [patchProfile, { isLoading }] = usePatchProfileMutation();
  const [patchProfilePhoto, photoState] = usePatchProfilePhotoMutation();
  const [form, setForm] = useState(initial);
  const [photoSrc, setPhotoSrc] = useState(initialPhoto);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const saving = isLoading || photoState.isLoading;
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ').trim();
  const selectedPhone =
    phoneCountries.find((country) => country.iso === form.phoneIso) ?? phoneCountries[0];

  useEffect(() => {
    if (initialPhoto || !profileId) return;
    const stored = readStoredProfilePhoto(profileId);
    if (stored) setPhotoSrc((current) => current || stored);
  }, [initialPhoto, profileId]);

  useEffect(() => {
    publishAdminProfileName(displayName);
  }, [displayName]);

  useEffect(
    () => () => {
      publishAdminProfileName(null);
      publishAdminProfilePhoto(null);
    },
    [],
  );

  function setField(name: 'first_name' | 'last_name' | 'phone', value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onPhoto(file: File | null) {
    setPhotoFile(file);
    if (!file) return;
    const src = URL.createObjectURL(file);
    setPhotoSrc(src);
    publishAdminProfilePhoto(src);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!profileId) {
      setError(t.admin.signInToSave);
      return;
    }

    const body: ProfileUpdateInput = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      ...(form.phone.trim()
        ? { phone: `${selectedPhone.dial}${form.phone.replace(/\D/g, '')}` }
        : {}),
    };

    try {
      await patchProfile({ profile_id: profileId, body }).unwrap();
      if (photoFile) {
        await rememberProfilePhoto(profileId, photoFile);
        try {
          await patchProfilePhoto({ profile_id: profileId, photo: photoFile }).unwrap();
        } catch {
          // The profile API has no photo field. The sidebar keeps the local copy.
        }
        setPhotoFile(null);
      }
      setMessage(t.admin.saved);
    } catch (submitError) {
      setError(formErrorText(submitError, t.admin.saveError));
    }
  }

  return (
    <div>
      <p className="m-0 text-sm text-dark">{t.account.hello}</p>
      <p className="mt-1 min-h-8 text-[28px] leading-tight font-bold text-dark md:text-[32px]">
        {displayName}
      </p>
      <div className="mt-4 mb-6 h-px w-full bg-black" />

      <form className={cardClass} onSubmit={onSubmit}>
        <h2 className="m-0 mb-5 text-lg font-medium text-dark">{t.profile.personalDataTitle}</h2>

        <label className="mb-6 flex w-max cursor-pointer flex-col items-center gap-2">
          <span className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-black bg-neutral-100 text-dark">
            {photoSrc ? (
              <img src={photoSrc} alt="" className="size-full object-cover" />
            ) : (
              <PersonMark />
            )}
          </span>
          <span className="text-sm text-dark/70">
            {photoSrc ? t.admin.replacePhoto : t.admin.addPhoto}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={photoSrc ? t.admin.replacePhoto : t.admin.addPhoto}
            onChange={(event) => {
              onPhoto(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>{t.profile.firstName}</span>
            <input
              className={inputClass}
              name="first_name"
              value={form.first_name}
              autoComplete="given-name"
              onChange={(event) => setField('first_name', event.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t.profile.lastName}</span>
            <input
              className={inputClass}
              name="last_name"
              value={form.last_name}
              autoComplete="family-name"
              onChange={(event) => setField('last_name', event.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>{t.profile.email}</span>
            <input className={inputClass} type="email" value={email} readOnly />
          </label>
          <PhoneNumberField
            label={t.profile.phoneNumber}
            value={form.phone}
            countryIso={form.phoneIso}
            onChange={(value) => setField('phone', value)}
            onCountryChange={(phoneIso) => setForm((current) => ({ ...current, phoneIso }))}
            placeholder={t.checkout.phonePlaceholder}
            locale={locale}
            labelClass={labelClass}
            inputClass={phoneInputClass}
          />
        </div>

        {error ? <p className="mt-3 mb-0 text-sm text-[#C0392B]">{error}</p> : null}
        {message ? <p className="mt-3 mb-0 text-center text-sm text-green-600">{message}</p> : null}

        <div className="mt-6 flex justify-center">
          <button className={adminButton} type="submit" disabled={saving}>
            {saving ? t.common.saving : t.profile.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProfile() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { email, hasSession } = useSessionEmail();
  const hasToken =
    typeof window !== 'undefined'
      ? Boolean(token) || Boolean(localStorage.getItem('accessToken'))
      : Boolean(token);
  const profile = useGetCurrentProfileQuery(undefined, {
    skip: !(hasToken || hasSession),
  });
  const profileId = profile.data?.id ?? null;
  const initial = profile.data ? profileToForm(profile.data) : emptyForm();
  const initialPhoto = profile.data ? profileImageSrc(profile.data) : '';

  if (profile.isLoading) {
    return <p className="m-0 text-sm text-dark/70">{t.common.loading}</p>;
  }

  return (
    <ProfileFields
      key={profileId ?? 'guest'}
      initial={initial}
      initialPhoto={initialPhoto}
      profileId={profileId}
      email={profile.data?.user?.email || email || user?.email || ''}
    />
  );
}

function emptyForm(): ProfileFormState {
  return { first_name: '', last_name: '', phone: '', phoneIso: 'UA' };
}

function PersonMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3" />
      <path strokeLinecap="round" d="M5 19a7 7 0 0 1 14 0" />
    </svg>
  );
}
