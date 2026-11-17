import type { Locale } from '@/i18n/config';
import {
  groupsOfCategory,
  type CatalogListingSlug,
} from '@/features/catalog/model/catalogCategory';
import type { CatalogColorView, CatalogProduct } from '@/features/catalog/model/catalogProduct';
import { buildProductHref } from '@/features/catalog/lib/buildProductHref';
import { discountBadge, isDiscountCurrent, salePrice } from '@/features/sales/lib/saleOffer';
import { toImageUrl } from '@/store/api/mappers/products.mapper';
import {
  formatCatalogPrice,
  pickMainImageUrl,
  resolvePurchasableVariant,
  resolveVariantPrice,
} from '@/features/catalog/lib/resolveVariantOffer';
import type {
  ApiProduct,
  Brand,
  CatalogColor,
  CatalogSize,
  CurrencyAmount,
  Discount,
  ProductImageRecord,
  ProductVariant,
  Subcategory,
} from '@/store/types';

const PLACEHOLDER_IMAGES = {
  en: {
    src: '/images/catalog/photo-placeholder-en.svg',
    alt: 'No photo',
  },
  uk: {
    src: '/images/catalog/photo-placeholder-uk.svg',
    alt: 'Немає фото',
  },
} as const;

type MapApiProductArgs = {
  product: ApiProduct;
  category: CatalogListingSlug;
  locale: Locale;
  brandById: Map<number, Brand>;
  subcategoryById: Map<number, Subcategory>;
  variants: ProductVariant[];
  colorsById: Map<number, CatalogColor>;
  sizesById: Map<number, CatalogSize>;
  images: ProductImageRecord[];
  currencies: CurrencyAmount[];
  discounts: Discount[];
};

function getLocalizedProductName(product: ApiProduct, locale: Locale): string {
  if (locale === 'en') {
    return product.name_en || product.name_uk || product.name || '';
  }

  return product.name_uk || product.name_en || product.name || '';
}

function getLocalizedProductDescription(product: ApiProduct, locale: Locale): string {
  if (locale === 'en') {
    return product.description_en || product.description_uk || product.description || '';
  }

  return product.description_uk || product.description_en || product.description || '';
}

/**
 * Builds the card out of exactly the variants given, so the photo, price, stock and the variant
 * the "+" button adds all describe the same thing (e.g. only the red ones).
 */
function buildCard(
  {
    product,
    category,
    locale,
    brandById,
    subcategoryById,
    colorsById,
    sizesById,
    images,
    currencies,
    discounts,
  }: MapApiProductArgs,
  productVariants: ProductVariant[],
): CatalogProduct {
  const productId = Number(product.id);
  const localizedName = getLocalizedProductName(product, locale);
  const localizedDescription = getLocalizedProductDescription(product, locale);
  const variantIds = new Set(productVariants.map((variant) => Number(variant.id)));

  const productImages = images.filter((image) => variantIds.has(Number(image.product_variant)));

  const preferredCurrency = locale === 'uk' ? 'UAH' : 'USD';
  const lowestPrice = resolveVariantPrice({
    variants: productVariants,
    currencies,
    preferredCurrency,
  });
  const subcategory = subcategoryById.get(Number(product.subcategory));
  const brand = brandById.get(Number(product.brand));
  const mainImageUrl = pickMainImageUrl(productImages);
  const image = mainImageUrl
    ? { src: mainImageUrl, alt: localizedName }
    : PLACEHOLDER_IMAGES[locale];

  const uniqueSizes = [
    ...new Set(
      productVariants
        .map((variant) => sizesById.get(Number(variant.size))?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const uniqueColors = [
    ...new Map(
      productVariants
        .map((variant) => colorsById.get(Number(variant.color)))
        .filter((color): color is CatalogColor => Boolean(color))
        .map((color) => [color.id, { name: color.name, hex: color.hex_code }] as const),
    ).values(),
  ];

  const inStock =
    productVariants.length === 0
      ? product.is_active
      : productVariants.some((variant) => variant.stock > 0);

  const mainImage = [...productImages].sort(
    (a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
  )[0];
  const purchasable = resolvePurchasableVariant({
    variants: productVariants,
    currencies,
    preferredCurrency,
    preferredVariantId: mainImage ? Number(mainImage.product_variant) : undefined,
    colorsById,
    sizesById,
  });
  const saleOffers = productVariants.flatMap((variant) => {
    const offer = resolveVariantPrice({
      variants: [variant],
      currencies,
      preferredCurrency,
    });
    if (!offer) return [];

    return discounts
      .filter(
        (discount) =>
          Number(discount.product_variant) === Number(variant.id) && isDiscountCurrent(discount),
      )
      .map((discount) => ({
        variant,
        discount,
        offer,
        saleAmount: salePrice(offer.amount, discount),
      }))
      .filter(({ saleAmount, offer: baseOffer }) => saleAmount < baseOffer.amount);
  });
  const bestSale = saleOffers.sort((left, right) => left.saleAmount - right.saleAmount)[0];
  const showSale = Boolean(bestSale && (!lowestPrice || bestSale.saleAmount < lowestPrice.amount));
  const displayPrice = showSale ? bestSale!.saleAmount : lowestPrice?.amount;
  const displayCurrency = showSale ? bestSale!.offer.currency : lowestPrice?.currency;
  const saleImage = showSale
    ? productImages
        .filter((item) => Number(item.product_variant) === Number(bestSale!.variant.id))
        .sort(
          (left, right) =>
            Number(right.is_main) - Number(left.is_main) || left.sort_order - right.sort_order,
        )[0]
    : undefined;
  const displayImage = saleImage ? { src: toImageUrl(saleImage.image), alt: localizedName } : image;
  const cartOffer = showSale
    ? {
        variantId: Number(bestSale!.variant.id),
        price: bestSale!.offer.amount,
        currency: bestSale!.offer.currency,
        sku: bestSale!.variant.sku,
        color: colorsById.get(Number(bestSale!.variant.color))?.name ?? '',
        size: sizesById.get(Number(bestSale!.variant.size))?.name ?? '',
      }
    : purchasable;

  return {
    id: String(product.id),
    slug: product.slug,
    category,
    subcategory: subcategory?.slug,
    type: subcategory?.name,
    title: localizedName,
    description: localizedDescription,
    price:
      displayPrice != null && displayCurrency
        ? formatCatalogPrice(displayPrice, displayCurrency, locale)
        : '—',
    compareAt:
      showSale && bestSale
        ? formatCatalogPrice(bestSale.offer.amount, bestSale.offer.currency, locale)
        : undefined,
    badge:
      showSale && bestSale
        ? discountBadge(bestSale.discount, locale, bestSale.offer.currency)
        : undefined,
    image: displayImage,
    sizes: uniqueSizes.length > 0 ? uniqueSizes : undefined,
    colors: uniqueColors.length > 0 ? uniqueColors : undefined,
    inStock,
    href: buildProductHref(category, product),
    brandId: product.brand,
    brandName: brand?.name,
    subcategoryId: product.subcategory,
    colorIds: productVariants.flatMap((variant) => (variant.color == null ? [] : [variant.color])),
    sizeIds: productVariants.flatMap((variant) => (variant.size == null ? [] : [variant.size])),
    variantOptions: productVariants.map((variant) => ({
      colorId: variant.color ?? undefined,
      colorName: colorsById.get(Number(variant.color))?.name,
      sizeId: variant.size ?? undefined,
      sizeName: sizesById.get(Number(variant.size))?.name,
    })),
    priceValue: displayPrice,
    genders: [...new Set(productVariants.map((variant) => variant.gender))],
    groups: groupsOfCategory(category),
    stockTotal: productVariants.reduce((sum, variant) => sum + variant.stock, 0),
    cartLine: cartOffer
      ? {
          productId,
          variantId: cartOffer.variantId,
          brand: brand?.name ?? '',
          title: localizedName,
          price: cartOffer.price,
          currency: cartOffer.currency,
          imageSrc: displayImage.src,
          imageAlt: displayImage.alt,
          sku: cartOffer.sku,
          color: cartOffer.color,
          size: cartOffer.size,
        }
      : undefined,
  };
}

export function mapApiProductToCatalogCard(args: MapApiProductArgs): CatalogProduct {
  const productId = Number(args.product.id);
  const productVariants = args.variants.filter(
    (variant) => Number(variant.product) === productId && variant.is_active !== false,
  );
  const card = buildCard(args, productVariants);

  // One view per color so a color filter can show that color's photo, price and link
  // instead of whichever variant the card picked as the default.
  const colorIds = [
    ...new Set(
      productVariants.flatMap((variant) => (variant.color == null ? [] : [Number(variant.color)])),
    ),
  ];
  if (colorIds.length === 0) return card;

  const colorViews: Record<number, CatalogColorView> = {};
  for (const colorId of colorIds) {
    const view = buildCard(
      args,
      productVariants.filter((variant) => Number(variant.color) === colorId),
    );
    colorViews[colorId] = {
      image: view.image,
      price: view.price,
      compareAt: view.compareAt,
      badge: view.badge,
      priceValue: view.priceValue,
      inStock: view.inStock,
      stockTotal: view.stockTotal,
      cartLine: view.cartLine,
      href: `${view.href}?color=${colorId}`,
    };
  }

  return { ...card, colorViews };
}
