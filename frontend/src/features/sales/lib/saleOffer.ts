import type { Locale } from '@/i18n/config';
import {
  formatCatalogPrice,
  resolveVariantPrice,
} from '@/features/catalog/lib/resolveVariantOffer';
import type {
  CatalogColor,
  CatalogSize,
  CurrencyAmount,
  Discount,
  ProductVariant,
} from '@/store/types';

export function isPercentDiscount(discount: Discount) {
  const type = discount.discount_type.trim().toLowerCase();
  const amount = Number(discount.amount);
  if (type.includes('percent') || type === 'pct' || type === '%') return true;
  if (type.includes('fix') || type.includes('amount') || type.includes('abs')) return false;
  return Number.isFinite(amount) && amount <= 100;
}

export function isDiscountCurrent(discount: Discount, now = Date.now()) {
  if (discount.is_active === false) return false;

  const start = Date.parse(discount.start_at);
  const end = Date.parse(discount.end_at);
  if (Number.isFinite(start) && now < start) return false;
  if (Number.isFinite(end) && now > end) return false;
  return true;
}

export function salePrice(price: number, discount: Discount) {
  const amount = Number(discount.amount);
  if (!Number.isFinite(price) || !Number.isFinite(amount) || amount <= 0) return price;
  const discountedPrice = isPercentDiscount(discount) ? price * (1 - amount / 100) : price - amount;
  return Math.round(Math.max(0, discountedPrice) * 100) / 100;
}

export function discountBadge(discount: Discount, locale: Locale, currency?: string) {
  const amount = Number(discount.amount);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  if (isPercentDiscount(discount)) return `−${Math.round(amount)}%`;
  return `−${formatCatalogPrice(amount, currency ?? (locale === 'uk' ? 'UAH' : 'USD'), locale)}`;
}

export function variantOffer(
  variant: ProductVariant,
  currencies: CurrencyAmount[] | undefined,
  locale: Locale,
) {
  return resolveVariantPrice({
    variants: [variant],
    currencies,
    preferredCurrency: locale === 'uk' ? 'UAH' : 'USD',
  });
}

export function variantLabel(
  variant: ProductVariant,
  colorsById: Map<number, CatalogColor>,
  sizesById: Map<number, CatalogSize>,
) {
  return {
    color: colorsById.get(Number(variant.color))?.name ?? '',
    size: sizesById.get(Number(variant.size))?.name ?? '',
  };
}
