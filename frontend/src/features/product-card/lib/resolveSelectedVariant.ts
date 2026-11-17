import { pickMainImageUrl } from '@/features/catalog/lib/resolveVariantOffer';
import type { CatalogColor, CatalogSize, ProductImageRecord, ProductVariant } from '@/store/types';

export type VariantSizeOption = {
  id: number;
  name: string;
};

export type VariantColorOption = {
  id: number;
  name: string;
  src: string;
  hex: string;
};

export function getImagesForVariant(
  images: ProductImageRecord[],
  variantId: number | undefined,
  variants: ProductVariant[],
): ProductImageRecord[] {
  if (variantId == null) return [];
  const variant = variants.find((item) => Number(item.id) === Number(variantId));
  const matchingVariantIds =
    variant?.color != null
      ? new Set(
          variants
            .filter((item) => Number(item.color) === Number(variant.color))
            .map((item) => Number(item.id)),
        )
      : new Set([Number(variantId)]);
  return images.filter((image) => matchingVariantIds.has(Number(image.product_variant)));
}

export function findMatchingVariant(args: {
  variants: ProductVariant[];
  sizeId?: number;
  colorId?: number;
  prefer?: 'size' | 'color';
}): ProductVariant | undefined {
  const variants = args.variants;
  if (variants.length === 0) return undefined;

  const bySizeAndColor = (sizeId?: number, colorId?: number) =>
    sizeId != null && colorId != null
      ? variants.find(
          (variant) => Number(variant.size) === sizeId && Number(variant.color) === colorId,
        )
      : undefined;

  const bySize = (sizeId?: number) =>
    sizeId != null ? variants.find((variant) => Number(variant.size) === sizeId) : undefined;

  const byColor = (colorId?: number) =>
    colorId != null ? variants.find((variant) => Number(variant.color) === colorId) : undefined;

  const exact = bySizeAndColor(args.sizeId, args.colorId);
  if (exact) return exact;

  if (args.prefer === 'color') {
    return byColor(args.colorId) ?? bySize(args.sizeId) ?? variants[0];
  }

  if (args.prefer === 'size') {
    return bySize(args.sizeId) ?? byColor(args.colorId) ?? variants[0];
  }

  return bySize(args.sizeId) ?? byColor(args.colorId) ?? variants[0];
}

export function buildVariantSizeOptions(args: {
  variants: ProductVariant[];
  sizes: CatalogSize[];
}): VariantSizeOption[] {
  const sizeById = new Map(args.sizes.map((item) => [Number(item.id), item]));
  const seen = new Set<number>();
  const options: Array<VariantSizeOption & { sortOrder: number }> = [];

  for (const variant of args.variants) {
    const sizeId = Number(variant.size);
    if (seen.has(sizeId)) continue;
    const size = sizeById.get(sizeId);
    if (!size) continue;
    seen.add(sizeId);
    options.push({
      id: sizeId,
      name: size.name,
      sortOrder: size.sort_order ?? 0,
    });
  }

  return options
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(({ id, name }) => ({ id, name }));
}

export function buildVariantColorOptions(args: {
  variants: ProductVariant[];
  colors: CatalogColor[];
  images: ProductImageRecord[];
}): VariantColorOption[] {
  const colorById = new Map(args.colors.map((item) => [Number(item.id), item]));
  const seen = new Set<number>();
  const options: VariantColorOption[] = [];

  for (const variant of args.variants) {
    const colorId = Number(variant.color);
    if (seen.has(colorId)) continue;
    const color = colorById.get(colorId);
    if (!color) continue;
    seen.add(colorId);

    const colorVariantIds = new Set(
      args.variants.filter((item) => Number(item.color) === colorId).map((item) => Number(item.id)),
    );
    const variantImages = args.images.filter((image) =>
      colorVariantIds.has(Number(image.product_variant)),
    );
    options.push({
      id: colorId,
      name: color.name,
      src: pickMainImageUrl(variantImages) ?? '',
      hex: color.hex_code,
    });
  }

  return options;
}
