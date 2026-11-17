'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { normalizeCurrencyCode, parseMoneyAmount } from '@/features/catalog/lib/resolveVariantOffer';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetCurrenciesQuery } from '@/store/endpoints/catalogMetaEndpoints';
import { syncCartPrices } from '@/store/slices/cartSlice';
import type { RootState } from '@/store/store';

export default function CartPriceSync() {
  const dispatch = useDispatch();
  const { locale } = useTranslation();
  const items = useSelector((state: RootState) => state.cart.items);
  const { data: currencies = [] } = useGetCurrenciesQuery();
  const preferredCurrency = locale === 'uk' ? 'UAH' : 'USD';

  useEffect(() => {
    if (!currencies.length || !items.length) return;

    const updates = items.flatMap((item) => {
      const rows = currencies.filter(
        (currency) => Number(currency.product_variant) === item.variantId,
      );
      const row =
        rows.find((currency) => normalizeCurrencyCode(currency.currency_code) === preferredCurrency) ??
        rows.find(
          (currency) => normalizeCurrencyCode(currency.currency_code) === normalizeCurrencyCode(item.currency),
        ) ??
        rows.find((currency) => normalizeCurrencyCode(currency.currency_code) === 'USD') ??
        rows[0];
      const amount = parseMoneyAmount(row?.amount);
      if (!row || amount == null) return [];
      const currency = normalizeCurrencyCode(row.currency_code);
      if (item.price === amount && item.currency === currency) return [];
      return [
        {
          productId: item.productId,
          variantId: item.variantId,
          price: amount,
          currency,
        },
      ];
    });

    if (updates.length > 0) dispatch(syncCartPrices(updates));
  }, [currencies, dispatch, items, preferredCurrency]);

  return null;
}
