import type { CartItem, Discount } from '@/store/types';

import { isDiscountCurrent, salePrice } from './saleOffer';

export function getCartLinePrice(
  item: CartItem,
  discounts: Discount[] | undefined,
  now = Date.now(),
) {
  const applicable = (discounts ?? []).filter(
    (discount) =>
      Number(discount.product_variant) === item.variantId && isDiscountCurrent(discount, now),
  );
  return applicable.reduce(
    (best, discount) => Math.min(best, salePrice(item.price, discount)),
    item.price,
  );
}
