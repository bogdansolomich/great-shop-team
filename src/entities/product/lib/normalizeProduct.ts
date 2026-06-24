import type { CatalogCategory } from '@/features/catalog/model/catalogCategory';
import type { Product, ProductPrice } from '@/entities/product/model/types';

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord =>
  value && typeof value === 'object' ? (value as RawRecord) : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asBoolean = (value: unknown, fallback = true): boolean =>
  typeof value === 'boolean' ? value : fallback;

const isCatalogCategory = (value: string): value is CatalogCategory =>
  value === 'men' || value === 'women' || value === 'accessories';

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const toImages = (value: unknown, legacyImage?: unknown): string[] => {
  const fromArray = toStringArray(value);

  if (fromArray.length > 0) {
    return fromArray;
  }

  const image = asRecord(legacyImage);
  const src = asString(image.src);

  return src ? [src] : [];
};

const toPrice = (value: unknown, legacyPrice?: unknown): ProductPrice => {
  const price = asRecord(value);

  if (typeof price.amount === 'number') {
    return {
      amount: price.amount,
      currency: asString(price.currency, 'USD'),
    };
  }

  if (typeof value === 'number') {
    return { amount: value, currency: 'USD' };
  }

  if (typeof legacyPrice === 'string') {
    const digits = legacyPrice.replace(/[^\d.]/g, '');
    const amount = Number(digits);

    if (Number.isFinite(amount) && amount > 0) {
      const currency = legacyPrice.includes('₴') ? 'UAH' : 'USD';
      return { amount, currency };
    }
  }

  return { amount: 0, currency: 'USD' };
};

const toColors = (value: unknown): Product['options']['colors'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const color = asRecord(item);
      const name = asString(color.name);
      const hex = asString(color.hex);

      if (!name) {
        return null;
      }

      return { name, hex: hex || '#000000' };
    })
    .filter((item): item is Product['options']['colors'][number] => item !== null);
};

const toOptions = (value: unknown, legacySizes?: unknown): Product['options'] => {
  const options = asRecord(value);
  const sizes = toStringArray(options.sizes);

  if (sizes.length > 0 || Array.isArray(options.colors)) {
    return {
      colors: toColors(options.colors),
      sizes,
    };
  }

  return {
    colors: [],
    sizes: toStringArray(legacySizes),
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function normalizeProduct(value: unknown, index: number): Product | null {
  const raw = asRecord(value);
  const categoryValue = asString(raw.category);

  if (!isCatalogCategory(categoryValue)) {
    return null;
  }

  const name = asString(raw.name) || asString(raw.title, `Product ${index + 1}`);
  const id = asString(raw.id, `${categoryValue}-${index + 1}`);
  const slug = asString(raw.slug, slugify(name));

  return {
    id,
    slug,
    name,
    category: categoryValue,
    subcategory: asString(
      raw.subcategory,
      categoryValue === 'accessories' ? 'fragrances' : 'clothing',
    ),
    type: asString(raw.type, 'apparel'),
    description: asString(raw.description),
    price: toPrice(raw.price, raw.price),
    images: toImages(raw.images, raw.image),
    options: toOptions(raw.options, raw.sizes),
    inStock: asBoolean(raw.inStock, true),
  };
}

export function parseProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => normalizeProduct(item, index))
    .filter((item): item is Product => item !== null);
}
