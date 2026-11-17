'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAuth } from '@/features/auth/hooks/useAuth';
import OrderShippedDialog from '@/features/checkout/ui/OrderShippedDialog';
import SuggestField, { type SuggestOption } from '@/features/checkout/ui/SuggestField';
import { phoneCountries, splitPhoneNumber } from '@/features/checkout/lib/phoneCountries';
import {
  clearCheckoutAddress,
  readSavedCheckoutAddress,
  saveCheckoutAddress,
  type SavedCheckoutAddress,
} from '@/features/checkout/lib/savedCheckoutAddress';
import {
  localizeArea,
  localizeNovaPoshta,
  localizeWarehouseKind,
} from '@/features/checkout/lib/novaPoshtaText';
import {
  formatLocalizedPrice,
  normalizeCurrencyCode,
} from '@/features/catalog/lib/resolveVariantOffer';
import { getCartLinePrice } from '@/features/sales/lib/cartDiscounts';
import { getColorLabel } from '@/i18n/colorLabel';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import { useGetDiscountsQuery } from '@/store/endpoints/discountsEndpoints';
import { useGetCurrentProfileQuery } from '@/store/endpoints/profilesEndpoints';
import PhoneNumberField from '@/shared/PhoneNumberField';
import type { RootState } from '@/store/store';
import { clearCart, removeFromCart, setCartItemQuantity } from '@/store/slices/cartSlice';
import type { CartItem } from '@/store/types';

type PaymentId = 'google' | 'visa' | 'mastercard';

type FieldErrors = Partial<
  Record<
    'firstName' | 'lastName' | 'phone' | 'email' | 'city' | 'warehouse' | 'payment' | 'terms',
    string
  >
>;

const readOrderDetail = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail.trim();
  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim())
      return value[0].trim();
  }
  return '';
};

const readOrderError = (
  payload: unknown,
  messages: {
    fallback: string;
    notEnoughStock: string;
    outOfStock: string;
    itemUnavailable: string;
    noServerPrice: string;
    variantMissing: string;
    cartEmpty: string;
    promoInvalid: string;
    promoFirstOrderOnly: string;
    promoNoEligibleItems: string;
  },
) => {
  const detail = readOrderDetail(payload);
  if (!detail) return messages.fallback;
  if (detail === 'Invalid promo code.') return messages.promoInvalid;
  if (detail === 'WELCOME10 is valid only for your first order.') {
    return messages.promoFirstOrderOnly;
  }
  if (detail === 'WELCOME10 does not apply to sale items.') {
    return messages.promoNoEligibleItems;
  }

  const stock = detail.match(/^Not enough stock for (.+): requested (\d+), available (\d+)\.?$/);
  if (stock) {
    const available = Number(stock[3]);
    if (available <= 0) return formatMessage(messages.outOfStock, { sku: stock[1] });
    return formatMessage(messages.notEnoughStock, {
      sku: stock[1],
      requested: stock[2],
      available: stock[3],
    });
  }

  const unavailable = detail.match(/^(.+) is not available\.$/);
  if (unavailable) return formatMessage(messages.itemUnavailable, { sku: unavailable[1] });

  const missingPrice = detail.match(/^(.+) has no price in ([A-Z]{3})\.$/);
  if (missingPrice) {
    return formatMessage(messages.noServerPrice, {
      sku: missingPrice[1],
      currency: missingPrice[2],
    });
  }

  if (
    detail === 'Product variant is not available.' ||
    detail === 'Some items in the cart are no longer available.'
  ) {
    return messages.variantMissing;
  }

  if (detail === 'Cart is empty.') return messages.cartEmpty;

  return messages.fallback;
};

const inputClass =
  'h-10 w-full rounded-[4px] border border-neutral-400 bg-white px-2.5 font-(family-name:--font-poppins) text-[13px] text-black outline-none placeholder:text-black/55 focus:border-black';

export default function CheckoutPage() {
  const { t, locale } = useTranslation();
  const dispatch = useDispatch();
  const { token } = useAuth();
  const items = useSelector((state: RootState) => state.cart.items);
  const { data: discounts } = useGetDiscountsQuery();
  const { data: profile } = useGetCurrentProfileQuery(undefined, { skip: !token });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneIso, setPhoneIso] = useState('UA');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [citySource, setCitySource] = useState('');
  const [cityRef, setCityRef] = useState('');
  const [cityOptions, setCityOptions] = useState<SuggestOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [warehouse, setWarehouse] = useState('');
  const [warehouseSource, setWarehouseSource] = useState('');
  const [warehouseRef, setWarehouseRef] = useState('');
  const [warehouseOptions, setWarehouseOptions] = useState<SuggestOption[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [payment, setPayment] = useState<PaymentId | ''>('');
  const [agreed, setAgreed] = useState(false);
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitNote, setSubmitNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loadError, setLoadError] = useState('');

  const cartItems = items.filter(
    (item) => typeof item.price === 'number' && typeof item.title === 'string',
  );
  const currency = normalizeCurrencyCode(
    cartItems[0]?.currency || (locale === 'uk' ? 'UAH' : 'USD'),
  );
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productDiscount = cartItems.reduce(
    (sum, item) => sum + (item.price - getCartLinePrice(item, discounts)) * item.quantity,
    0,
  );
  const promoEligibleSubtotal = cartItems.reduce((sum, item) => {
    const currentPrice = getCartLinePrice(item, discounts);
    return currentPrice === item.price ? sum + currentPrice * item.quantity : sum;
  }, 0);
  const promoDiscount =
    appliedPromo === 'WELCOME10'
      ? Math.round((promoEligibleSubtotal * 0.1 + Number.EPSILON) * 100) / 100
      : 0;
  const discount = productDiscount + promoDiscount;
  const shippingFee = 0;
  const total = subtotal - discount + shippingFee;
  const selectedPhone = phoneCountries.find((item) => item.iso === phoneIso) ?? phoneCountries[0];

  useEffect(() => {
    const saved = readSavedCheckoutAddress();
    if (!saved) return;
    setFirstName(saved.firstName || '');
    setLastName(saved.lastName || '');
    setPhoneIso(saved.phoneIso || 'UA');
    setPhone(saved.phone || '');
    setEmail(saved.email || '');
    setCitySource(saved.city || '');
    setCityRef(saved.cityRef || '');
    setWarehouseSource(saved.warehouse || '');
    setWarehouseRef(saved.warehouseRef || '');
    setNotes(saved.notes || '');
    setSaveAddress(true);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const saved = readSavedCheckoutAddress();

    if (!firstName && !saved?.firstName && profile.first_name) setFirstName(profile.first_name);
    if (!lastName && !saved?.lastName && profile.last_name) setLastName(profile.last_name);
    if (!email && !saved?.email && profile.user?.email) setEmail(profile.user.email);
    if (!phone && !saved?.phone && profile.phone) {
      const parsedPhone = splitPhoneNumber(profile.phone);
      setPhoneIso(parsedPhone.countryIso);
      setPhone(parsedPhone.nationalNumber);
    }
  }, [email, firstName, lastName, phone, profile]);

  useEffect(() => {
    if (citySource) setCity(localizeNovaPoshta(citySource, locale));
    if (warehouseSource) setWarehouse(localizeNovaPoshta(warehouseSource, locale));
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
  }, [locale, citySource, warehouseSource]);

  const cityTimer = useRef<number | null>(null);
  const warehouseTimer = useRef<number | null>(null);

  const loadCities = async (query: string) => {
    setCitiesLoading(true);
    setLoadError('');
    try {
      const response = await fetch(`/api/nova-poshta?kind=cities&q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as {
        items?: { id: string; label: string; area?: string }[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'failed');
      const queryLower = query.trim().toLowerCase();
      setCityOptions(
        (payload.items ?? [])
          .map((item) => ({
            id: item.id,
            source: item.label,
            label: localizeNovaPoshta(item.label, locale),
            hintSource: item.area,
            hint: item.area ? localizeArea(item.area, locale) : undefined,
          }))
          .filter(
            (item) =>
              !queryLower ||
              item.label.toLowerCase().includes(queryLower) ||
              (item.source || '').toLowerCase().includes(queryLower),
          ),
      );
    } catch {
      setCityOptions([]);
      setLoadError(t.checkout.loadError);
    } finally {
      setCitiesLoading(false);
    }
  };

  const loadWarehouses = async (query: string) => {
    if (!cityRef) {
      setWarehouseOptions([]);
      return;
    }
    setWarehousesLoading(true);
    setLoadError('');
    try {
      const response = await fetch(
        `/api/nova-poshta?kind=warehouses&cityRef=${encodeURIComponent(cityRef)}&q=${encodeURIComponent(query)}`,
      );
      const payload = (await response.json()) as {
        items?: { id: string; label: string; kind?: string }[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'failed');
      const queryLower = query.trim().toLowerCase();
      setWarehouseOptions(
        (payload.items ?? [])
          .map((item) => ({
            id: item.id,
            source: item.label,
            label: localizeNovaPoshta(item.label, locale),
            hintSource: item.kind,
            hint: item.kind ? localizeWarehouseKind(item.kind, locale) : undefined,
          }))
          .filter(
            (item) =>
              !queryLower ||
              item.label.toLowerCase().includes(queryLower) ||
              (item.source || '').toLowerCase().includes(queryLower),
          ),
      );
    } catch {
      setWarehouseOptions([]);
      setLoadError(t.checkout.loadError);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const changeQuantity = (item: CartItem, nextQuantity: number) => {
    dispatch(
      setCartItemQuantity({
        productId: item.productId,
        variantId: item.variantId,
        quantity: nextQuantity,
      }),
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || orderPlaced) return;

    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = t.checkout.required;
    if (!lastName.trim()) nextErrors.lastName = t.checkout.required;
    if (!/^\d{7,12}$/.test(phone.replace(/\s/g, ''))) nextErrors.phone = t.checkout.invalidPhone;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextErrors.email = t.checkout.invalidEmail;
    if (!cityRef) nextErrors.city = t.checkout.selectCity;
    if (!warehouseRef) nextErrors.warehouse = t.checkout.selectWarehouse;
    if (!payment) nextErrors.payment = t.checkout.selectPayment;
    if (!agreed) nextErrors.terms = t.checkout.agreeRequired;
    if (cartItems.length === 0) nextErrors.payment = t.checkout.emptyText;
    if (cartItems.some((item) => item.variantId <= 0)) nextErrors.payment = t.checkout.orderFailed;

    setErrors(nextErrors);
    setSubmitNote('');
    if (Object.keys(nextErrors).length > 0) return;
    if (cartItems.some((item) => item.price <= 0)) {
      setSubmitNote(t.checkout.noPrice);
      return;
    }

    if (saveAddress) {
      const saved: SavedCheckoutAddress = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneIso,
        phone: phone.trim(),
        email: email.trim(),
        city: citySource || city.trim(),
        cityRef,
        warehouse: warehouseSource || warehouse.trim(),
        warehouseRef,
        notes: notes.trim(),
      };
      saveCheckoutAddress(saved);
    } else {
      clearCheckoutAddress();
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBase) {
      setSubmitNote(t.checkout.orderFailed);
      return;
    }

    const localPhone = phone.replace(/\D/g, '');
    const dial = selectedPhone.dial.replace(/\D/g, '');
    const shippingAddress = [
      citySource.trim() || city.trim(),
      warehouseSource.trim() || warehouse.trim(),
    ]
      .filter(Boolean)
      .join(', ')
      .slice(0, 500);

    setSubmitting(true);
    try {
      const token = window.localStorage.getItem('accessToken');
      const lines = cartItems.map((item) => ({
        product_variant_id: item.variantId,
        quantity: item.quantity,
      }));
      const orderBody = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: `+${dial}${localPhone}`,
        email: email.trim(),
        shipping_address: shippingAddress,
        comment: notes.trim(),
        currency_code: currency,
        language: locale === 'en' ? 'en' : 'uk',
        payment_method: payment,
        promo_code: appliedPromo,
        items: lines,
        ...(lines.length === 1
          ? {
              product_variant_id: lines[0].product_variant_id,
              quantity: lines[0].quantity,
            }
          : {}),
      };
      const postOrder = (authorization?: string) =>
        fetch(`${apiBase.replace(/\/$/, '')}/api/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authorization ? { Authorization: authorization } : {}),
          },
          body: JSON.stringify(orderBody),
        });

      let response = await postOrder(token ? `Bearer ${token}` : undefined);
      if (response.status === 401 && token) {
        response = await postOrder();
      }
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const orderError = readOrderError(payload, {
          fallback: t.checkout.orderFailed,
          notEnoughStock: t.checkout.notEnoughStock,
          outOfStock: t.checkout.outOfStock,
          itemUnavailable: t.checkout.itemUnavailable,
          noServerPrice: t.checkout.noServerPrice,
          variantMissing: t.checkout.variantMissing,
          cartEmpty: t.checkout.cartEmpty,
          promoInvalid: t.checkout.promoInvalid,
          promoFirstOrderOnly: t.checkout.promoFirstOrderOnly,
          promoNoEligibleItems: t.checkout.promoNoEligibleItems,
        });
        const promoRejected =
          appliedPromo &&
          [
            'Invalid promo code.',
            'WELCOME10 is valid only for your first order.',
            'WELCOME10 does not apply to sale items.',
          ].includes(readOrderDetail(payload));
        if (promoRejected) {
          setAppliedPromo('');
          setPromoMessage(orderError);
          setSubmitNote(t.checkout.promoRejectedRetry);
          return;
        }
        setSubmitNote(response.status === 502 ? t.checkout.emailFailed : orderError);
        return;
      }
      dispatch(clearCart());
      setOrderPlaced(true);
    } catch {
      setSubmitNote(t.checkout.orderFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const payments: { id: PaymentId; src: string; alt: string }[] = [
    { id: 'google', src: '/images/catalog/google-pay-icon.png', alt: t.checkout.googlePay },
    { id: 'visa', src: '/images/catalog/visa-icon.svg', alt: t.checkout.visa },
    { id: 'mastercard', src: '/images/catalog/mastercard-icon.svg', alt: t.checkout.mastercard },
  ];

  return (
    <section className="layout-container max-w-[1240px] bg-white py-6 text-dark md:py-8">
      <h1 className="m-0 font-(family-name:--font-poppins) text-[28px] leading-tight font-medium text-black md:text-[32px]">
        {t.checkout.metaTitle}
      </h1>

      <form
        className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="checkout-personal-title" className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-black/25 pb-2">
              <span className="font-(family-name:--font-poppins) text-[14px] font-medium text-black">
                1.
              </span>
              <h2
                id="checkout-personal-title"
                className="m-0 font-(family-name:--font-poppins) text-[16px] leading-tight font-medium text-black"
              >
                {t.checkout.personalInfo}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 mobile:grid-cols-2">
              <Field error={errors.firstName}>
                <span className="font-(family-name:--font-poppins) text-[11px] text-black">
                  {t.checkout.firstName}
                </span>
                <input
                  value={firstName}
                  autoComplete="given-name"
                  className={inputClass}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </Field>
              <Field error={errors.lastName}>
                <span className="font-(family-name:--font-poppins) text-[11px] text-black">
                  {t.checkout.lastName}
                </span>
                <input
                  value={lastName}
                  autoComplete="family-name"
                  className={inputClass}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 mobile:grid-cols-2">
              <PhoneNumberField
                label={t.checkout.phone}
                value={phone}
                countryIso={phoneIso}
                onChange={setPhone}
                onCountryChange={setPhoneIso}
                placeholder={t.checkout.phonePlaceholder}
                error={errors.phone}
                locale={locale}
                labelClass="font-(family-name:--font-poppins) text-[11px] text-black"
                inputClass={`flex h-10 min-w-0 items-center gap-1.5 rounded-[4px] border bg-white px-2 ${
                  errors.phone ? 'border-error' : 'border-neutral-400'
                }`}
              />

              <label className="flex min-w-0 flex-col gap-1">
                <span className="font-(family-name:--font-poppins) text-[11px] text-black">
                  {t.checkout.email}
                </span>
                <input
                  type="email"
                  value={email}
                  placeholder={t.checkout.emailPlaceholder}
                  autoComplete="email"
                  className={`${inputClass} ${errors.email ? 'border-error' : ''}`}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {errors.email ? <span className="text-xs text-error">{errors.email}</span> : null}
              </label>
            </div>
          </section>

          <section aria-labelledby="checkout-delivery-title" className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-black/25 pb-2">
              <span className="font-(family-name:--font-poppins) text-[14px] font-medium text-black">
                2.
              </span>
              <h2
                id="checkout-delivery-title"
                className="m-0 font-(family-name:--font-poppins) text-[16px] leading-tight font-medium text-black"
              >
                {t.checkout.deliveryMethod}
              </h2>
              <Image
                src="/images/catalog/new-posta-icon.png"
                alt={t.checkout.novaPoshta}
                width={40}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>

            <SuggestField
              value={city}
              placeholder={t.checkout.city}
              options={cityOptions}
              loading={citiesLoading}
              emptyText={t.checkout.noMatches}
              error={errors.city}
              onOpen={() => {
                void loadCities(city);
              }}
              onValueChange={(value) => {
                setCity(value);
                setCitySource('');
                setCityRef('');
                setWarehouse('');
                setWarehouseSource('');
                setWarehouseRef('');
                if (cityTimer.current) window.clearTimeout(cityTimer.current);
                cityTimer.current = window.setTimeout(() => {
                  void loadCities(value);
                }, 250);
              }}
              onSelect={(option) => {
                setCity(option.label);
                setCitySource(option.source || option.label);
                setCityRef(option.id);
                setWarehouse('');
                setWarehouseSource('');
                setWarehouseRef('');
              }}
            />

            <SuggestField
              value={warehouse}
              placeholder={t.checkout.warehouse}
              options={warehouseOptions}
              loading={warehousesLoading}
              emptyText={t.checkout.noMatches}
              error={errors.warehouse}
              disabled={!cityRef}
              onOpen={() => {
                void loadWarehouses(warehouse);
              }}
              onValueChange={(value) => {
                setWarehouse(value);
                setWarehouseSource('');
                setWarehouseRef('');
                if (warehouseTimer.current) window.clearTimeout(warehouseTimer.current);
                warehouseTimer.current = window.setTimeout(() => {
                  void loadWarehouses(value);
                }, 250);
              }}
              onSelect={(option) => {
                setWarehouse(option.label);
                setWarehouseSource(option.source || option.label);
                setWarehouseRef(option.id);
              }}
            />
            {loadError ? <p className="m-0 text-[12px] text-error">{loadError}</p> : null}

            <textarea
              value={notes}
              placeholder={t.checkout.notes}
              rows={2}
              className="h-14 min-h-14 w-full resize-y rounded-[4px] border border-neutral-400 bg-white px-2.5 py-2 font-(family-name:--font-poppins) text-[12px] text-black outline-none placeholder:text-black/55 focus:border-black"
              onChange={(event) => setNotes(event.target.value)}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveAddress}
                className="size-3 shrink-0 accent-black"
                onChange={(event) => setSaveAddress(event.target.checked)}
              />
              <span className="font-(family-name:--font-poppins) text-[10px] text-black/70">
                {t.checkout.saveAddress}
              </span>
            </label>
          </section>

          <section aria-labelledby="checkout-payment-title" className="flex flex-col gap-3">
            <h2
              id="checkout-payment-title"
              className="m-0 border-b border-black/25 pb-2 font-(family-name:--font-poppins) text-[16px] leading-tight font-medium text-black"
            >
              <span className="mr-2">3.</span>
              {t.checkout.paymentMethod}
            </h2>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t.checkout.paymentMethod}
            >
              {payments.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={payment === method.id}
                  aria-label={method.alt}
                  className={`inline-flex h-9 w-[68px] items-center justify-center rounded-[3px] border bg-white p-1 ${
                    payment === method.id ? 'border-black' : 'border-neutral-300'
                  }`}
                  onClick={() => setPayment(method.id)}
                >
                  <Image
                    src={method.src}
                    alt=""
                    width={56}
                    height={28}
                    className="h-6 w-auto object-contain"
                  />
                </button>
              ))}
            </div>
            {errors.payment ? <p className="m-0 text-xs text-error">{errors.payment}</p> : null}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                className="mt-0.5 size-3 shrink-0 accent-black"
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span className="font-(family-name:--font-poppins) text-[10px] text-dark/55 underline">
                <Link href="/terms" className="text-inherit">
                  {t.checkout.terms}
                </Link>
                {' · '}
                <Link href="/privacy" className="text-inherit">
                  {t.checkout.privacy}
                </Link>
              </span>
            </label>
            {errors.terms ? <p className="m-0 text-xs text-error">{errors.terms}</p> : null}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-black/25 pb-2">
              <h2 className="m-0 font-(family-name:--font-poppins) text-[16px] leading-tight font-medium text-black">
                {t.checkout.shoppingCard}
              </h2>
            </div>
            {cartItems.length === 0 ? (
              <div className="py-10 text-center">
                <p className="m-0 text-lg">{t.checkout.emptyTitle}</p>
                <p className="m-0 mt-2 text-sm text-dark/60">{t.checkout.emptyText}</p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm text-white no-underline"
                >
                  {t.checkout.toCatalog}
                </Link>
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {cartItems.map((item) => {
                  const unitPrice = getCartLinePrice(item, discounts);
                  const hasDiscount = unitPrice < item.price;
                  return (
                    <li
                      key={`${item.productId}-${item.variantId}`}
                      className="border-b border-black/20 py-3"
                    >
                      <div className="flex gap-2.5">
                        <div className="relative h-20 w-16 shrink-0 bg-neutral-100">
                          {item.imageSrc ? (
                            <Image
                              src={item.imageSrc}
                              alt={item.imageAlt || item.title}
                              fill
                              sizes="64px"
                              className="object-contain"
                            />
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="m-0 font-(family-name:--font-poppins) text-[12px] font-semibold text-black">
                                {item.brand}
                              </p>
                              <p className="m-0 mt-0.5 font-(family-name:--font-poppins) text-[11px] leading-tight text-black">
                                {item.title}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              {hasDiscount ? (
                                <p className="m-0 font-(family-name:--font-poppins) text-[10px] text-black/50 line-through">
                                  {formatLocalizedPrice(
                                    item.price * item.quantity,
                                    item.currency,
                                    locale,
                                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                                  )}
                                </p>
                              ) : null}
                              <p className="m-0 font-(family-name:--font-poppins) text-[12px] text-black">
                                {formatLocalizedPrice(
                                  unitPrice * item.quantity,
                                  item.currency,
                                  locale,
                                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="m-0 mt-1 font-(family-name:--font-poppins) text-[10px] leading-[1.35] text-black/70">
                            {t.checkout.sku}: {item.sku || '—'}
                            <br />
                            {t.checkout.color}: {getColorLabel(item.color, t.colors) || '—'}
                            <br />
                            {t.checkout.size}: {item.size || '—'}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex h-6 w-[62px] items-center justify-between rounded-[3px] border border-neutral-300 px-1">
                              <button
                                type="button"
                                aria-label={t.checkout.decrease}
                                disabled={item.quantity <= 1}
                                className="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 disabled:opacity-40"
                                onClick={() => changeQuantity(item, item.quantity - 1)}
                              >
                                <Image
                                  src="/images/catalog/minus-icon.svg"
                                  alt=""
                                  width={12}
                                  height={12}
                                />
                              </button>
                              <span className="text-[11px]">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label={t.checkout.increase}
                                className="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0"
                                onClick={() => changeQuantity(item, item.quantity + 1)}
                              >
                                <Image
                                  src="/images/catalog/plus-icon.svg"
                                  alt=""
                                  width={12}
                                  height={12}
                                />
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label={t.checkout.remove}
                              className="inline-flex size-6 items-center justify-center border-0 bg-transparent p-0"
                              onClick={() =>
                                dispatch(
                                  removeFromCart({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                  }),
                                )
                              }
                            >
                              <Image
                                src="/images/catalog/basket-delete-icon.svg"
                                alt=""
                                width={16}
                                height={16}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={promo}
              placeholder={t.checkout.promo}
              className={inputClass}
              onChange={(event) => {
                setPromo(event.target.value);
                setAppliedPromo('');
                setPromoMessage('');
              }}
            />
            <button
              type="button"
              disabled={!promo.trim()}
              className="h-10 shrink-0 cursor-pointer rounded-[3px] border-none bg-black px-5 font-(family-name:--font-poppins) text-[12px] text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                const normalizedCode = promo.trim().toUpperCase();
                if (normalizedCode !== 'WELCOME10') {
                  setAppliedPromo('');
                  setPromoMessage(t.checkout.promoInvalid);
                  return;
                }
                if (promoEligibleSubtotal <= 0) {
                  setAppliedPromo('');
                  setPromoMessage(t.checkout.promoNoEligibleItems);
                  return;
                }
                setAppliedPromo(normalizedCode);
                setPromoMessage(t.checkout.promoApplied);
              }}
            >
              {t.checkout.apply}
            </button>
          </div>
          <p className="m-0 font-(family-name:--font-poppins) text-[11px] text-dark/60">
            {t.checkout.promoFirstOrderHint}
          </p>
          {promoMessage ? (
            <p className="m-0 font-(family-name:--font-poppins) text-[11px] text-dark/60">
              {promoMessage}
            </p>
          ) : null}

          <dl className="m-0 flex flex-col gap-2 border-t border-black/20 pt-3">
            {[
              [
                t.checkout.subtotal,
                formatLocalizedPrice(subtotal, currency, locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              ],
              [
                t.checkout.discount,
                formatLocalizedPrice(discount, currency, locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              ],
              [
                t.checkout.shippingFee,
                formatLocalizedPrice(shippingFee, currency, locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="font-(family-name:--font-poppins) text-[12px] text-black">
                  {label}
                </dt>
                <dd className="m-0 font-(family-name:--font-poppins) text-[12px] text-black">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between gap-4 border-t border-black/15 pt-4">
            <p className="m-0 font-(family-name:--font-poppins) text-[16px] font-semibold text-black">
              {t.checkout.total}
            </p>
            <p className="m-0 font-(family-name:--font-poppins) text-[16px] font-semibold text-black">
              {formatLocalizedPrice(total, currency, locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || orderPlaced}
            className="h-10 w-full cursor-pointer rounded-[3px] border-none bg-black font-(family-name:--font-poppins) text-[12px] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t.checkout.submitting : t.checkout.confirm}
          </button>
          {submitNote ? (
            <p role="status" className="m-0 text-sm text-dark/70">
              {submitNote}
            </p>
          ) : null}
        </aside>
      </form>

      <OrderShippedDialog
        open={orderPlaced}
        title={t.checkout.shippedTitle}
        sent={t.checkout.shippedSent}
        thanks={t.checkout.shippedThanks}
        homeLabel={t.checkout.home}
      />
    </section>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      {children}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </label>
  );
}
