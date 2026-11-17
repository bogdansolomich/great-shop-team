'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  localizeArea,
  localizeNovaPoshta,
  localizeWarehouseKind,
} from '@/features/checkout/lib/novaPoshtaText';
import { phoneCountries, splitPhoneNumber } from '@/features/checkout/lib/phoneCountries';
import {
  readSavedCheckoutAddress,
  saveCheckoutAddress,
} from '@/features/checkout/lib/savedCheckoutAddress';
import SuggestField, { type SuggestOption } from '@/features/checkout/ui/SuggestField';
import {
  readAccountProfile,
  type AccountProfile,
} from '@/features/profile/ui/ProfileForm/accountProfile';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetCurrentUserQuery } from '@/store/endpoints/authEndpoints';
import { usePatchProfileMutation } from '@/store/endpoints/profilesEndpoints';
import PhoneNumberField from '@/shared/PhoneNumberField';

type AddressForm = {
  city: string;
  citySource: string;
  cityRef: string;
  warehouse: string;
  warehouseSource: string;
  warehouseRef: string;
};

const emptyAddress: AddressForm = {
  city: '',
  citySource: '',
  cityRef: '',
  warehouse: '',
  warehouseSource: '',
  warehouseRef: '',
};

const labelClass = 'mb-1.5 block text-sm text-dark/80';

const inputClass =
  'h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-dark outline-none focus:border-black';
const phoneInputClass =
  'flex h-11 min-w-0 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3';

const cardClass = 'rounded-xl border border-neutral-200 p-5 md:p-6';

const saveClass =
  'mx-auto mt-6 flex h-11 cursor-pointer items-center justify-center rounded-lg border-none bg-black px-8 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60';

function readAddress(): AddressForm {
  const saved = readSavedCheckoutAddress();
  if (!saved) return emptyAddress;
  const citySource = saved.city ?? '';
  const warehouseSource = saved.warehouse ?? '';
  return {
    city: citySource,
    citySource,
    cityRef: saved.cityRef ?? '',
    warehouse: warehouseSource,
    warehouseSource,
    warehouseRef: saved.warehouseRef ?? '',
  };
}

function AccountDetailsForm({
  profile,
  email,
  canSave,
  onNameChange,
}: {
  profile: AccountProfile;
  email: string;
  canSave: boolean;
  onNameChange?: (name: string) => void;
}) {
  const { t, locale } = useTranslation();

  const [patchProfile, { isLoading }] = usePatchProfileMutation();
  const initialPhone = splitPhoneNumber(profile.phone ?? '');

  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    phone: initialPhone.nationalNumber,
    phoneIso: initialPhone.countryIso,
  });

  const [address, setAddress] = useState<AddressForm>(() => readAddress());
  const [cityOptions, setCityOptions] = useState<SuggestOption[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<SuggestOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSaved, setAddressSaved] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const cityTimer = useRef<number | null>(null);
  const warehouseTimer = useRef<number | null>(null);

  const selectedPhone =
    phoneCountries.find((country) => country.iso === form.phoneIso) ?? phoneCountries[0];

  useEffect(() => {
    setCityOptions((current) =>
      current.map((option) => ({
        ...option,
        label: localizeNovaPoshta(option.source || option.label, locale),
        hint: option.hintSource ? localizeArea(option.hintSource, locale) : option.hint,
      })),
    );
    setWarehouseOptions((current) =>
      current.map((option) => ({
        ...option,
        label: localizeNovaPoshta(option.source || option.label, locale),
        hint: option.hintSource ? localizeWarehouseKind(option.hintSource, locale) : option.hint,
      })),
    );
  }, [locale]);

  useEffect(
    () => () => {
      if (cityTimer.current) window.clearTimeout(cityTimer.current);
      if (warehouseTimer.current) window.clearTimeout(warehouseTimer.current);
    },
    [],
  );

  useEffect(() => {
    onNameChange?.([form.first_name, form.last_name].filter(Boolean).join(' ').trim());
  }, [form.first_name, form.last_name, onNameChange]);

  function updateField(name: 'first_name' | 'last_name' | 'phone', value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function loadCities(query: string) {
    setCitiesLoading(true);
    setAddressError('');
    try {
      const response = await fetch(`/api/nova-poshta?kind=cities&q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as {
        items?: { id: string; label: string; area?: string }[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Could not load cities');
      setCityOptions(
        (payload.items ?? []).map((item) => ({
          id: item.id,
          source: item.label,
          label: localizeNovaPoshta(item.label, locale),
          hintSource: item.area,
          hint: item.area ? localizeArea(item.area, locale) : undefined,
        })),
      );
    } catch {
      setCityOptions([]);
      setAddressError(t.checkout.loadError);
    } finally {
      setCitiesLoading(false);
    }
  }

  async function loadWarehouses(query: string) {
    if (!address.cityRef) {
      setWarehouseOptions([]);
      return;
    }
    setWarehousesLoading(true);
    setAddressError('');
    try {
      const response = await fetch(
        `/api/nova-poshta?kind=warehouses&cityRef=${encodeURIComponent(address.cityRef)}&q=${encodeURIComponent(query)}`,
      );
      const payload = (await response.json()) as {
        items?: { id: string; label: string; kind?: string }[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Could not load warehouses');
      setWarehouseOptions(
        (payload.items ?? []).map((item) => ({
          id: item.id,
          source: item.label,
          label: localizeNovaPoshta(item.label, locale),
          hintSource: item.kind,
          hint: item.kind ? localizeWarehouseKind(item.kind, locale) : undefined,
        })),
      );
    } catch {
      setWarehouseOptions([]);
      setAddressError(t.checkout.loadError);
    } finally {
      setWarehousesLoading(false);
    }
  }

  function updateCity(value: string) {
    setAddressSaved(false);
    setAddress((current) => ({
      ...current,
      city: value,
      citySource: '',
      cityRef: '',
      warehouse: '',
      warehouseSource: '',
      warehouseRef: '',
    }));
    if (cityTimer.current) window.clearTimeout(cityTimer.current);
    cityTimer.current = window.setTimeout(() => void loadCities(value), 250);
  }

  function updateWarehouse(value: string) {
    setAddressSaved(false);
    setAddress((current) => ({
      ...current,
      warehouse: value,
      warehouseSource: '',
      warehouseRef: '',
    }));
    if (warehouseTimer.current) window.clearTimeout(warehouseTimer.current);
    warehouseTimer.current = window.setTimeout(() => void loadWarehouses(value), 250);
  }

  async function savePersonal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPersonalError('');

    try {
      await patchProfile({
        profile_id: profile.id,
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          ...(form.phone.trim()
            ? { phone: `${selectedPhone.dial}${form.phone.replace(/\D/g, '')}` }
            : {}),
        },
      }).unwrap();
    } catch {
      setPersonalError(t.common.error);
    }
  }

  function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddressError('');
    try {
      saveCheckoutAddress({
        city: address.citySource,
        cityRef: address.cityRef,
        warehouse: address.warehouseSource,
        warehouseRef: address.warehouseRef,
      });
      setAddressSaved(true);
    } catch {
      setAddressSaved(false);
      setAddressError(t.common.error);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form className={cardClass} onSubmit={savePersonal}>
        <h2 className="m-0 mb-5 text-lg font-medium text-dark">{t.profile.personalDataTitle}</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>{t.profile.firstName}</span>
            <input
              className={inputClass}
              name="first_name"
              value={form.first_name}
              autoComplete="given-name"
              onChange={(event) => updateField('first_name', event.target.value)}
            />
          </label>

          <label>
            <span className={labelClass}>{t.profile.lastName}</span>
            <input
              className={inputClass}
              name="last_name"
              value={form.last_name}
              autoComplete="family-name"
              onChange={(event) => updateField('last_name', event.target.value)}
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
            onChange={(value) => updateField('phone', value)}
            onCountryChange={(phoneIso) => setForm((current) => ({ ...current, phoneIso }))}
            placeholder={t.checkout.phonePlaceholder}
            locale={locale}
            labelClass={labelClass}
            inputClass={phoneInputClass}
          />
        </div>

        {personalError ? <p className="mt-3 mb-0 text-sm text-[#C0392B]">{personalError}</p> : null}

        <button className={saveClass} type="submit" disabled={isLoading || !canSave}>
          {isLoading ? t.common.saving : t.profile.saveChanges}
        </button>
      </form>

      <form className={cardClass} onSubmit={saveAddress}>
        <h2 className="m-0 mb-5 text-lg font-medium text-dark">{t.address.address}</h2>

        <div className="flex flex-col gap-4">
          <SuggestField
            label={t.checkout.city}
            value={
              address.citySource ? localizeNovaPoshta(address.citySource, locale) : address.city
            }
            placeholder={t.checkout.city}
            options={cityOptions}
            loading={citiesLoading}
            emptyText={t.checkout.noMatches}
            onOpen={() => void loadCities(address.city)}
            onValueChange={updateCity}
            onSelect={(option) => {
              setAddressSaved(false);
              setAddress((current) => ({
                ...current,
                city: option.label,
                citySource: option.source || option.label,
                cityRef: option.id,
                warehouse: '',
                warehouseSource: '',
                warehouseRef: '',
              }));
            }}
          />

          <SuggestField
            label={t.checkout.warehouse}
            value={
              address.warehouseSource
                ? localizeNovaPoshta(address.warehouseSource, locale)
                : address.warehouse
            }
            placeholder={t.checkout.warehouse}
            options={warehouseOptions}
            loading={warehousesLoading}
            emptyText={t.checkout.noMatches}
            disabled={!address.cityRef}
            onOpen={() => void loadWarehouses(address.warehouse)}
            onValueChange={updateWarehouse}
            onSelect={(option) => {
              setAddressSaved(false);
              setAddress((current) => ({
                ...current,
                warehouse: option.label,
                warehouseSource: option.source || option.label,
                warehouseRef: option.id,
              }));
            }}
          />
        </div>

        {addressError ? <p className="mt-3 mb-0 text-sm text-[#C0392B]">{addressError}</p> : null}
        {addressSaved ? (
          <p className="mt-3 mb-0 text-center text-sm text-green-600">
            {locale === 'uk' ? 'Збережено' : 'Saved'}
          </p>
        ) : null}

        <button className={saveClass} type="submit">
          {t.profile.saveChanges}
        </button>
      </form>

      <div className="flex flex-col gap-3 rounded-xl border border-[#DA000066] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 text-sm text-[#C0392B]">{t.profile.deleteAccountTitle}</p>

          <p className="mt-1 mb-0 max-w-xl text-sm text-[#9A9A97]">
            {t.profile.deleteAccountWarning}
          </p>
        </div>

        <button
          type="button"
          className="h-11 shrink-0 cursor-pointer rounded-lg border border-[#DA000066] bg-white px-4 text-sm text-[#C0392B]"
        >
          {t.profile.deleteAccountTitle}
        </button>
      </div>
    </div>
  );
}

export default function AccountDetails({
  onNameChange,
}: {
  onNameChange?: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { token, authEmail } = useAuth();

  const { data, isLoading, isError } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  const profile = readAccountProfile(data);
  const email = profile?.user?.email || authEmail || '';

  if (isLoading) {
    return <p className="m-0 text-sm text-dark/70">{t.common.loading}</p>;
  }

  return (
    <AccountDetailsForm
      key={profile?.id ?? 'new'}
      profile={
        profile ?? {
          id: 0,
          first_name: '',
          last_name: '',
          phone: '',
        }
      }
      email={email}
      canSave={Boolean(profile) && !isError}
      onNameChange={onNameChange}
    />
  );
}
