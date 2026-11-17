'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import { flagImageSrc, phoneCountries } from '@/features/checkout/lib/phoneCountries';

type PhoneNumberFieldProps = {
  label: string;
  value: string;
  countryIso: string;
  onChange: (value: string) => void;
  onCountryChange: (iso: string) => void;
  placeholder?: string;
  error?: string;
  locale: 'en' | 'uk';
  inputClass?: string;
  labelClass?: string;
};

export default function PhoneNumberField({
  label,
  value,
  countryIso,
  onChange,
  onCountryChange,
  placeholder = '',
  error,
  locale,
  inputClass,
  labelClass,
}: PhoneNumberFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedCountry =
    phoneCountries.find((country) => country.iso === countryIso) ?? phoneCountries[0];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative flex min-w-0 flex-col gap-1">
      <span className={labelClass}>{label}</span>
      <div
        className={`${inputClass ?? 'flex h-10 min-w-0 items-center gap-1.5 rounded-[4px] border bg-white px-2'} ${
          error ? 'border-error' : ''
        }`}
      >
        <button
          type="button"
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={listId}
          className="inline-flex shrink-0 items-center border-0 bg-transparent p-0"
          onClick={() => setIsOpen((open) => !open)}
        >
          <Image
            src={flagImageSrc(selectedCountry.iso)}
            alt=""
            width={28}
            height={20}
            className="h-4 w-6 rounded-[2px] object-cover"
          />
        </button>
        <span className="shrink-0 font-(family-name:--font-poppins) text-[11px] text-black/60">
          {selectedCountry.dial}
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          autoComplete="tel-national"
          className="h-full min-w-0 flex-1 border-0 bg-transparent font-(family-name:--font-poppins) text-[11px] text-black outline-none placeholder:text-black/50"
          onChange={(event) => onChange(event.target.value.replace(/[^\d\s]/g, ''))}
        />
      </div>
      {isOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {phoneCountries.map((country) => (
            <li key={country.iso}>
              <button
                type="button"
                role="option"
                aria-selected={country.iso === countryIso}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-black/5"
                onClick={() => {
                  onCountryChange(country.iso);
                  setIsOpen(false);
                }}
              >
                <Image
                  src={flagImageSrc(country.iso)}
                  alt=""
                  width={28}
                  height={20}
                  className="h-5 w-7 rounded-xs object-cover"
                />
                <span className="text-sm">{locale === 'uk' ? country.nameUk : country.nameEn}</span>
                <span className="ml-auto text-sm text-dark/55">{country.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </div>
  );
}
