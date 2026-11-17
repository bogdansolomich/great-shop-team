import type { Locale } from '@/i18n/config';
import { toImageUrl } from '@/store/api/mappers/products.mapper';
import type { CurrencyAmount, ProductImageRecord, ProductVariant } from '@/store/types';

export function normalizeCurrencyCode(code: string | null | undefined): string {
  const raw = (code ?? '').trim();
  if (!raw || raw === '$' || raw.toUpperCase() === 'USD') return 'USD';
  if (raw === '₴' || raw.toUpperCase() === 'UAH') return 'UAH';
  return raw.toUpperCase();
}

export function parseMoneyAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const amount = Number(value);
    if (Number.isFinite(amount)) return amount;
  }
  return undefined;
}

function offerForVariant(
  variant: ProductVariant,
  currencies: CurrencyAmount[] | undefined,
  preferredCurrency = 'USD',
): { amount: number; currency: string } | undefined {
  const rows = (currencies ?? []).filter(
    (item) =>
      Number(item.product_variant) === Number(variant.id) && parseMoneyAmount(item.amount) != null,
  );
  const preferredCode = normalizeCurrencyCode(preferredCurrency);
  const fromCurrency =
    rows.find((item) => normalizeCurrencyCode(item.currency_code) === preferredCode) ??
    rows.find((item) => normalizeCurrencyCode(item.currency_code) === 'USD') ??
    rows.sort((a, b) => (parseMoneyAmount(a.amount) ?? 0) - (parseMoneyAmount(b.amount) ?? 0))[0];
  if (fromCurrency) {
    return {
      amount: parseMoneyAmount(fromCurrency.amount) as number,
      currency: normalizeCurrencyCode(fromCurrency.currency_code || 'USD'),
    };
  }

  const amount = parseMoneyAmount(variant.price);
  if (amount == null) return undefined;
  return { amount, currency: 'USD' };
}

export function resolvePurchasableVariant(args: {
  variants: ProductVariant[];
  currencies?: CurrencyAmount[];
  preferredVariantId?: number;
  preferredCurrency?: string;
  colorsById: Map<number, { name: string }>;
  sizesById: Map<number, { name: string }>;
}):
  | {
      variantId: number;
      price: number;
      currency: string;
      sku: string;
      color: string;
      size: string;
    }
  | undefined {
  const inStock = args.variants.filter((variant) => variant.stock > 0);
  if (inStock.length === 0) return undefined;

  const preferred =
    args.preferredVariantId == null
      ? undefined
      : inStock.find((variant) => Number(variant.id) === Number(args.preferredVariantId));

  const priced = inStock
    .map((variant) => ({
      variant,
      offer: offerForVariant(variant, args.currencies, args.preferredCurrency),
    }))
    .filter(
      (item): item is { variant: ProductVariant; offer: { amount: number; currency: string } } =>
        item.offer != null,
    )
    .sort((a, b) => a.offer.amount - b.offer.amount);

  const preferredOffer = preferred
    ? offerForVariant(preferred, args.currencies, args.preferredCurrency)
    : undefined;
  const chosen =
    preferred && preferredOffer ? { variant: preferred, offer: preferredOffer } : priced[0];

  if (!chosen?.offer) return undefined;

  return {
    variantId: Number(chosen.variant.id),
    price: chosen.offer.amount,
    currency: chosen.offer.currency,
    sku: chosen.variant.sku,
    color: args.colorsById.get(Number(chosen.variant.color))?.name ?? '',
    size: args.sizesById.get(Number(chosen.variant.size))?.name ?? '',
  };
}

export function resolveVariantPrice(args: {
  variants: ProductVariant[];
  currencies?: CurrencyAmount[];
  preferredCurrency?: string;
}): { amount: number; currency: string } | undefined {
  const variantIds = new Set(args.variants.map((variant) => Number(variant.id)));

  const validCurrencies = (args.currencies ?? [])
    .filter((item) => variantIds.has(Number(item.product_variant)))
    .map((item) => ({
      amount: parseMoneyAmount(item.amount),
      currency: normalizeCurrencyCode(item.currency_code || 'USD'),
    }))
    .filter((item): item is { amount: number; currency: string } => item.amount != null);

  const preferredCurrency = normalizeCurrencyCode(args.preferredCurrency ?? 'USD');
  const matchingCurrency = validCurrencies.filter((item) => item.currency === preferredCurrency);
  const currenciesToCompare =
    matchingCurrency.length > 0
      ? matchingCurrency
      : validCurrencies.filter((item) => item.currency === 'USD');
  const fromCurrencies = [
    ...(currenciesToCompare.length > 0 ? currenciesToCompare : validCurrencies),
  ].sort((a, b) => a.amount - b.amount);

  if (fromCurrencies[0]) return fromCurrencies[0];

  const fromVariants = args.variants
    .map((variant) => parseMoneyAmount(variant.price))
    .filter((amount): amount is number => amount != null)
    .sort((a, b) => a - b);

  if (fromVariants[0] != null) {
    return { amount: fromVariants[0], currency: 'USD' };
  }

  return undefined;
}

export function formatLocalizedPrice(
  amount: number,
  currency: string,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const keepFractions =
    options.maximumFractionDigits != null || options.minimumFractionDigits != null;
  const numberOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 0,
    ...options,
  };
  if (normalizedCurrency === 'UAH' && locale === 'uk' && !keepFractions) {
    numberOptions.minimumFractionDigits = 0;
    numberOptions.maximumFractionDigits = 0;
  }
  const formatted = new Intl.NumberFormat(
    locale === 'uk' ? 'uk-UA' : 'en-US',
    numberOptions,
  ).format(amount);
  if (normalizedCurrency === 'USD') return `$${formatted}`;
  const label = normalizedCurrency === 'UAH' && locale === 'uk' ? 'грн' : normalizedCurrency;
  return `${formatted} ${label}`;
}

export function formatCatalogPrice(amount: number, currency: string, locale: Locale): string {
  return formatLocalizedPrice(amount, currency, locale);
}

export function pickMainImageUrl(images: ProductImageRecord[]): string | undefined {
  const sorted = [...images].sort(
    (a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
  );
  const src = sorted[0]?.image;
  return src ? toImageUrl(src) : undefined;
}
