'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import { toImageUrl } from '@/store/api/mappers/products.mapper';
import { useCreateBrandMutation, useGetBrandsQuery } from '@/store/endpoints/brandsEndpoints';
import {
  useCreateCurrencyMutation,
  useCreateProductVariantMutation,
  useDeleteCurrencyMutation,
  useDeleteProductVariantMutation,
  useGetColorsQuery,
  useGetCurrenciesQuery,
  useGetProductImagesQuery,
  useGetProductVariantsQuery,
  useGetSizesQuery,
  usePatchCurrencyMutation,
  usePatchProductVariantMutation,
} from '@/store/endpoints/catalogMetaEndpoints';
import {
  useCreateAdminProductImageMutation,
  useDeleteAdminProductImageMutation,
  useCreateAdminProductMutation,
  useGetAdminCategoriesQuery,
  useGetAdminProductByIdQuery,
  useGetAdminSubcategoriesQuery,
  usePatchAdminProductImageMutation,
  usePatchAdminProductMutation,
} from '@/store/endpoints/adminEndpoints';
import {
  useCreateDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
  usePatchDiscountMutation,
} from '@/store/endpoints/discountsEndpoints';
import type { ProductVariant, ProductVariantGender, ProductWriteInput } from '@/store/types';

import { adminButton, adminButtonCompact } from './adminClasses';
import AdminPhotoEditor, { type AdminPhoto } from './AdminPhotoEditor';
import { formErrorText } from './formError';

const fieldClass =
  'h-11 w-full rounded-xl border border-[#e7eaf0] bg-[#f8f9fc] px-4 text-sm text-[#1d2433] outline-none transition-colors focus:border-black focus:bg-white';
const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-[#8b93a1] uppercase';
const cardClass = 'overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgb(30_41_59/6%)]';
const cardPad = 'p-5 sm:p-6';
const cardHead = 'border-b border-[#f0f2f6] px-5 py-4 sm:px-6';

const emptyProduct: ProductWriteInput = {
  name: '',
  name_uk: '',
  name_en: '',
  slug: '',
  description: '',
  description_uk: '',
  description_en: '',
  brand: 0,
  subcategory: 0,
  is_active: true,
  is_hidden: false,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function containsErrorCode(value: unknown, code: string): boolean {
  if (value === code) return true;
  if (Array.isArray(value)) return value.some((item) => containsErrorCode(item, code));
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => containsErrorCode(item, code));
  }
  return false;
}

function isSlugTaken(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    containsErrorCode(error.data, 'slug_taken')
  );
}

type OfferRow = {
  key: string;
  remoteId?: number;
  priceUah: string;
  priceUsd: string;
  size: string;
  color: string;
  sku?: string;
  stock?: number;
  gender?: ProductVariantGender;
};

type DiscountRow = {
  key: string;
  remoteId?: number;
  variantId?: number;
  offerKey?: string;
  amount: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

type SaveStage = 'product' | 'variants' | 'discounts' | 'photos';

function emptyOffer(): OfferRow {
  return {
    key: `offer-${Math.random().toString(36).slice(2)}`,
    priceUah: '',
    priceUsd: '',
    size: '',
    color: '',
  };
}

function dateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function defaultDiscountDates() {
  const now = new Date();
  now.setSeconds(0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  return {
    startAt: dateTimeLocal(now.toISOString()),
    endAt: dateTimeLocal(end.toISOString()),
  };
}

function offerStarted(row: OfferRow) {
  return Boolean(row.priceUah.trim() || row.priceUsd.trim() || row.size || row.color);
}

function isPositiveAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function expectedSizeType(
  category?: { slug: string; name_en?: string | null },
  subcategory?: {
    slug: string;
    name_en?: string | null;
  },
) {
  const categoryName = `${category?.slug ?? ''} ${category?.name_en ?? ''}`.toLowerCase();
  const subcategoryName = `${subcategory?.slug ?? ''} ${subcategory?.name_en ?? ''}`.toLowerCase();

  if (/\b(perfumes?|fragrances?)\b/.test(categoryName)) return 'perfume';
  if (/\bshoes?\b/.test(categoryName)) return 'shoes';
  if (/\baccessories\b/.test(categoryName) || /\baccessories\b/.test(subcategoryName)) {
    return 'accessories';
  }
  if (/\bclothing\b/.test(categoryName) || /\bclothing\b/.test(subcategoryName)) {
    return 'clothing';
  }

  return undefined;
}

function requiresVariantColor(sizeType: string | undefined) {
  return sizeType !== 'perfume';
}

function ProductFields({
  initial,
  productId,
  initialVariants,
}: {
  initial: ProductWriteInput;
  productId?: number;
  initialVariants?: ProductVariant[];
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const brands = useGetBrandsQuery();
  const [createBrand, createBrandState] = useCreateBrandMutation();
  const categories = useGetAdminCategoriesQuery();
  const subcategories = useGetAdminSubcategoriesQuery();
  const [createProduct, createState] = useCreateAdminProductMutation();
  const [patchProduct, patchState] = usePatchAdminProductMutation();
  const variants = useGetProductVariantsQuery();
  const images = useGetProductImagesQuery(undefined, { skip: !productId });
  const colors = useGetColorsQuery();
  const sizes = useGetSizesQuery();
  const currencies = useGetCurrenciesQuery();
  const discounts = useGetDiscountsQuery();
  const [createCurrency] = useCreateCurrencyMutation();
  const [patchCurrency] = usePatchCurrencyMutation();
  const [deleteCurrency] = useDeleteCurrencyMutation();
  const [createDiscount] = useCreateDiscountMutation();
  const [patchDiscount] = usePatchDiscountMutation();
  const [deleteDiscount] = useDeleteDiscountMutation();
  const [createImage] = useCreateAdminProductImageMutation();
  const [patchImage] = usePatchAdminProductImageMutation();
  const [deleteImage] = useDeleteAdminProductImageMutation();
  const [createVariant] = useCreateProductVariantMutation();
  const [patchVariant] = usePatchProductVariantMutation();
  const [deleteVariant] = useDeleteProductVariantMutation();
  const [form, setForm] = useState(initial);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [photosReady, setPhotosReady] = useState(!productId);
  const [offers, setOffers] = useState<OfferRow[]>([emptyOffer()]);
  const [discountRows, setDiscountRows] = useState<DiscountRow[]>([]);
  const [offersReady, setOffersReady] = useState(!productId);
  const [discountsReady, setDiscountsReady] = useState(!productId);
  const [slugEdited, setSlugEdited] = useState(Boolean(productId));
  const [error, setError] = useState('');
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandSlugEdited, setBrandSlugEdited] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInProgress = useRef(false);
  const saving = isSubmitting || createState.isLoading || patchState.isLoading;
  const selectedSubcategory = subcategories.data?.find((item) => item.id === form.subcategory);
  const selectedCategory = categories.data?.find(
    (item) => item.id === selectedSubcategory?.category,
  );
  const sizeType = expectedSizeType(selectedCategory, selectedSubcategory);
  const availableSizes = (sizes.data ?? []).filter(
    (size) => !sizeType || size.size_type === sizeType,
  );
  const photoColorOptions = (colors.data ?? [])
    .filter((color) => color.is_active !== false)
    .map((color) => ({ id: color.id, name: color.name }));

  async function onCreateBrand() {
    setBrandError('');

    if (!brandName.trim() || !brandSlug.trim()) {
      setBrandError(t.admin.saveError);
      return;
    }

    try {
      const brand = await createBrand({
        name: brandName.trim(),
        slug: brandSlug.trim(),
        is_active: true,
        is_hidden: false,
      }).unwrap();
      setForm((current) => ({ ...current, brand: brand.id }));
      setBrandName('');
      setBrandSlug('');
      setBrandSlugEdited(false);
      setBrandFormOpen(false);
    } catch (createError) {
      setBrandError(formErrorText(createError, t.admin.saveError));
    }
  }

  const remotePhotos = useMemo(() => {
    if (!productId) return [];
    const variantById = new Map(
      (initialVariants ?? variants.data ?? [])
        .filter((variant) => variant.product === productId)
        .map((variant) => [variant.id, variant]),
    );
    return (images.data ?? [])
      .filter((image) => variantById.has(image.product_variant))
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((image) => ({
        key: `image-${image.id}`,
        src: toImageUrl(image.image),
        remoteId: image.id,
        variantId: image.product_variant,
        colorId: variantById.get(image.product_variant)?.color ?? undefined,
      }));
  }, [images.data, initialVariants, productId, variants.data]);

  useEffect(() => {
    if (!productId || photosReady || variants.isLoading || images.isLoading) return;
    setPhotos(remotePhotos);
    setPhotosReady(true);
  }, [images.isLoading, photosReady, productId, remotePhotos, variants.isLoading]);

  const loadedOffers = useMemo(() => {
    if (!productId) return [];
    return (initialVariants ?? variants.data ?? [])
      .filter((variant) => variant.product === productId)
      .map((variant) => ({
        key: `variant-${variant.id}`,
        remoteId: variant.id,
        priceUah:
          currencies.data?.find(
            (item) => item.product_variant === variant.id && item.currency_code === 'UAH',
          )?.amount ?? '',
        priceUsd:
          currencies.data?.find(
            (item) => item.product_variant === variant.id && item.currency_code === 'USD',
          )?.amount ?? '',
        size: variant.size ? String(variant.size) : '',
        color: variant.color ? String(variant.color) : '',
        sku: variant.sku,
        stock: variant.stock,
        gender: variant.gender,
      }));
  }, [currencies.data, initialVariants, productId, variants.data]);

  const loadedDiscounts = useMemo(() => {
    if (!productId) return [];
    const variantIds = new Set(
      (initialVariants ?? variants.data ?? [])
        .filter((variant) => variant.product === productId)
        .map((variant) => variant.id),
    );
    return (discounts.data ?? []).filter((discount) => variantIds.has(discount.product_variant));
  }, [discounts.data, initialVariants, productId, variants.data]);

  useEffect(() => {
    if (
      !productId ||
      offersReady ||
      (!initialVariants && variants.isLoading) ||
      currencies.isLoading
    )
      return;
    setOffers(loadedOffers.length ? loadedOffers : [emptyOffer()]);
    setOffersReady(true);
  }, [
    currencies.isLoading,
    initialVariants,
    loadedOffers,
    offersReady,
    productId,
    variants.isLoading,
  ]);

  useEffect(() => {
    if (
      !productId ||
      discountsReady ||
      discounts.isLoading ||
      discounts.isError ||
      (!initialVariants && (variants.isLoading || variants.isError))
    )
      return;
    setDiscountRows(
      loadedDiscounts.map((discount) => ({
        key: `discount-${discount.id}`,
        remoteId: discount.id,
        variantId: discount.product_variant,
        amount: discount.amount,
        startAt: dateTimeLocal(discount.start_at),
        endAt: dateTimeLocal(discount.end_at),
        isActive: discount.is_active,
      })),
    );
    setDiscountsReady(true);
  }, [
    discounts.isLoading,
    discounts.isError,
    discountsReady,
    initialVariants,
    loadedDiscounts,
    productId,
    variants.isError,
    variants.isLoading,
  ]);

  async function savePhotos(
    savedProductId: number,
    savedVariants: {
      firstVariantId?: number;
      variantIdByColor: Map<number, number>;
      variantIds: Set<number>;
    },
  ) {
    const resolvePhotoVariantId = (photo: AdminPhoto) =>
      (photo.colorId != null ? savedVariants.variantIdByColor.get(photo.colorId) : undefined) ??
      (photo.variantId != null && savedVariants.variantIds.has(photo.variantId)
        ? photo.variantId
        : undefined) ??
      savedVariants.firstVariantId ??
      (initialVariants ?? variants.data ?? []).find((variant) => variant.product === savedProductId)
        ?.id;
    const kept = new Set(
      photos.map((photo) => photo.remoteId).filter((id): id is number => typeof id === 'number'),
    );

    for (const photo of remotePhotos) {
      if (photo.remoteId && !kept.has(photo.remoteId)) {
        await deleteImage(photo.remoteId).unwrap();
      }
    }

    const sameOrder =
      photos.length === remotePhotos.length &&
      photos.every((photo, index) => photo.remoteId === remotePhotos[index]?.remoteId);
    const mainVariantIds = new Set<number>();

    for (const [order, photo] of photos.entries()) {
      const productVariantId = resolvePhotoVariantId(photo);
      if (!productVariantId) throw new Error('photo');
      const isMain = !mainVariantIds.has(productVariantId);
      mainVariantIds.add(productVariantId);

      if (photo.remoteId && photo.file) {
        await deleteImage(photo.remoteId).unwrap();
        await createImage({
          product_variant: productVariantId,
          image: photo.file,
          is_main: isMain,
          sort_order: order,
        }).unwrap();
      } else if (photo.remoteId) {
        if (!sameOrder || photo.variantId !== productVariantId) {
          await patchImage({
            id: photo.remoteId,
            product_variant: productVariantId,
            is_main: isMain,
            sort_order: order,
          }).unwrap();
        }
      } else if (photo.file) {
        await createImage({
          product_variant: productVariantId,
          image: photo.file,
          is_main: isMain,
          sort_order: order,
        }).unwrap();
      }
    }
  }

  function setOffer(key: string, patch: Partial<OfferRow>) {
    setOffers((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addDiscount(offer: OfferRow) {
    const dates = defaultDiscountDates();
    setDiscountRows((current) => [
      ...current,
      {
        key: `discount-${Math.random().toString(36).slice(2)}`,
        variantId: offer.remoteId,
        offerKey: offer.remoteId ? undefined : offer.key,
        amount: '',
        ...dates,
        isActive: true,
      },
    ]);
  }

  function setDiscount(key: string, patch: Partial<DiscountRow>) {
    setDiscountRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function saveDiscounts(savedVariants: {
    variantIdByOfferKey: Map<string, number>;
    variantIds: Set<number>;
  }) {
    const keptDiscountIds = new Set<number>();
    const applicableRows = discountRows.flatMap((row) => {
      const variantId =
        row.variantId ??
        (row.offerKey ? savedVariants.variantIdByOfferKey.get(row.offerKey) : undefined);
      if (!variantId || !savedVariants.variantIds.has(variantId)) return [];
      return [{ row, variantId }];
    });

    applicableRows.forEach(({ row }) => {
      if (row.remoteId) keptDiscountIds.add(row.remoteId);
    });

    for (const discount of loadedDiscounts) {
      if (
        !keptDiscountIds.has(discount.id) &&
        savedVariants.variantIds.has(discount.product_variant)
      ) {
        await deleteDiscount(discount.id).unwrap();
      }
    }

    for (const { row, variantId } of applicableRows) {
      if (!row.amount.trim()) {
        if (row.remoteId) await deleteDiscount(row.remoteId).unwrap();
        continue;
      }
      const body = {
        product_variant: variantId,
        discount_type: 'percentage',
        amount: row.amount.trim(),
        start_at: new Date(row.startAt).toISOString(),
        end_at: new Date(row.endAt).toISOString(),
        is_active: row.isActive,
      };
      if (row.remoteId) {
        await patchDiscount({ id: row.remoteId, body }).unwrap();
      } else {
        await createDiscount(body).unwrap();
      }
    }
  }

  async function saveOffers(savedProductId: number, productSlug = form.slug) {
    let firstVariantId: number | undefined;
    const variantIdByColor = new Map<number, number>();
    const variantIds = new Set<number>();
    const variantIdByOfferKey = new Map<string, number>();
    const kept = new Set(
      offers.map((row) => row.remoteId).filter((id): id is number => typeof id === 'number'),
    );

    for (const row of loadedOffers) {
      if (row.remoteId && !kept.has(row.remoteId)) {
        await deleteVariant(row.remoteId).unwrap();
      }
    }

    for (const row of offers) {
      if (!offerStarted(row)) continue;
      if (
        !row.size ||
        (requiresVariantColor(sizeType) && !row.color) ||
        !isPositiveAmount(row.priceUah) ||
        (row.priceUsd.trim() && !isPositiveAmount(row.priceUsd))
      ) {
        throw new Error('offer');
      }

      const body = {
        product: savedProductId,
        size: Number(row.size),
        color: row.color ? Number(row.color) : null,
        sku: row.sku || `${productSlug}-${row.size}${row.color ? `-${row.color}` : ''}`,
        stock: row.stock ?? 0,
        gender: row.gender || 'unisex',
        is_active: true,
      } as const;

      if (row.remoteId) {
        await patchVariant({ id: row.remoteId, body }).unwrap();
        await savePrice(row.remoteId, 'UAH', row.priceUah);
        await savePrice(row.remoteId, 'USD', row.priceUsd);
        firstVariantId ??= row.remoteId;
        variantIds.add(row.remoteId);
        variantIdByOfferKey.set(row.key, row.remoteId);
        if (row.color && !variantIdByColor.has(Number(row.color))) {
          variantIdByColor.set(Number(row.color), row.remoteId);
        }
      } else {
        const created = await createVariant(body).unwrap();
        await savePrice(created.id, 'UAH', row.priceUah);
        await savePrice(created.id, 'USD', row.priceUsd);
        firstVariantId ??= created.id;
        variantIds.add(created.id);
        variantIdByOfferKey.set(row.key, created.id);
        if (row.color && !variantIdByColor.has(Number(row.color))) {
          variantIdByColor.set(Number(row.color), created.id);
        }
      }
    }

    return { firstVariantId, variantIdByColor, variantIds, variantIdByOfferKey };
  }

  async function savePrice(variantId: number, currencyCode: 'UAH' | 'USD', rawAmount: string) {
    const price = currencies.data?.find(
      (item) => item.product_variant === variantId && item.currency_code === currencyCode,
    );
    const amount = rawAmount.trim();

    if (!amount) {
      if (price) await deleteCurrency(price.id).unwrap();
      return;
    }
    if (price) {
      await patchCurrency({ id: price.id, body: { amount } }).unwrap();
      return;
    }

    await createCurrency({
      product_variant: variantId,
      currency_code: currencyCode,
      amount,
    }).unwrap();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInProgress.current) return;
    setError('');

    if (
      !(form.name_uk ?? '').trim() ||
      !(form.name_en ?? '').trim() ||
      !(form.slug ?? '').trim() ||
      !form.brand ||
      !form.subcategory
    ) {
      setError(t.admin.saveError);
      return;
    }

    if (
      offers.some(
        (row) =>
          offerStarted(row) &&
          (!row.size ||
            (requiresVariantColor(sizeType) && !row.color) ||
            !isPositiveAmount(row.priceUah) ||
            (row.priceUsd.trim() && !isPositiveAmount(row.priceUsd))),
      )
    ) {
      setError(t.admin.saveError);
      return;
    }

    const invalidDiscount = discountRows.some((row) => {
      if (!row.amount.trim()) return false;
      const amount = Number(row.amount);
      const start = Date.parse(row.startAt);
      const end = Date.parse(row.endAt);
      return (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100 ||
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
      );
    });
    if (
      invalidDiscount ||
      (productId &&
        (!discountsReady || discounts.isError || (!initialVariants && variants.isError)))
    ) {
      setError(t.admin.saveError);
      return;
    }

    if (photos.some((photo) => photo.file) && !offers.some(offerStarted)) {
      setError(t.admin.saveError);
      return;
    }

    const body: ProductWriteInput = {
      ...form,
      name: (form.name_uk || form.name_en || form.name || '').trim(),
      name_uk: (form.name_uk ?? '').trim(),
      name_en: (form.name_en ?? '').trim(),
      slug: (form.slug ?? '').trim(),
      description: (form.description_uk || form.description_en || form.description || '').trim(),
      description_uk: (form.description_uk ?? '').trim(),
      description_en: (form.description_en ?? '').trim(),
    };

    let saveStage: SaveStage = 'product';
    try {
      submitInProgress.current = true;
      setIsSubmitting(true);
      if (productId) {
        await patchProduct({ id: productId, body }).unwrap();
        saveStage = 'variants';
        const savedVariants = await saveOffers(productId, body.slug);
        saveStage = 'discounts';
        await saveDiscounts(savedVariants);
        saveStage = 'photos';
        await savePhotos(productId, savedVariants);
        router.push('/admin/products');
        return;
      }

      let created;
      try {
        created = await createProduct(body).unwrap();
      } catch (createError) {
        if (!isSlugTaken(createError)) throw createError;
        created = await createProduct({ ...body, slug: '' }).unwrap();
      }
      setForm((current) => ({ ...current, slug: created.slug }));
      saveStage = 'variants';
      const savedVariants = await saveOffers(created.id, created.slug);
      saveStage = 'discounts';
      await saveDiscounts(savedVariants);
      saveStage = 'photos';
      await savePhotos(created.id, savedVariants);
      router.push('/admin/products');
    } catch (submitError) {
      const errorDetail = formErrorText(submitError, t.admin.saveError);
      const stageLabel = {
        product: t.admin.details,
        variants: t.admin.variantsTitle,
        discounts: t.admin.discountTitle,
        photos: t.admin.photoAngles,
      }[saveStage];
      setError(`${stageLabel}: ${errorDetail}`);
    } finally {
      submitInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <section className={cardClass}>
        <div className={cardHead}>
          <h2 className="m-0 text-base font-bold">{t.admin.photoAngles}</h2>
          <p className="m-0 mt-1 text-sm text-[#9aa1ad]">{t.admin.photoAnglesHint}</p>
        </div>
        <div className={cardPad}>
          <AdminPhotoEditor
            photos={photos}
            onChange={setPhotos}
            colorOptions={photoColorOptions}
            defaultColorId={photoColorOptions[0]?.id}
            label=""
            hint=""
          />
        </div>
      </section>

      <section className={cardClass}>
        <div className={cardHead}>
          <h2 className="m-0 text-base font-bold">{t.admin.details}</h2>
        </div>
        <div className={`${cardPad} grid grid-cols-1 gap-4 md:grid-cols-2`}>
          <label className="block">
            <span className={labelClass}>{t.admin.name} — Українська</span>
            <input
              className={fieldClass}
              value={form.name_uk ?? form.name ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setForm((current) => ({
                  ...current,
                  name_uk: value,
                  name: value,
                  slug: slugEdited ? current.slug : slugify(value),
                }));
              }}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.name} — English</span>
            <input
              className={fieldClass}
              value={form.name_en ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, name_en: event.target.value }))
              }
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.description} — Українська</span>
            <textarea
              className={`${fieldClass} h-28 resize-y py-3`}
              value={form.description_uk ?? form.description ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, description_uk: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.description} — English</span>
            <textarea
              className={`${fieldClass} h-28 resize-y py-3`}
              value={form.description_en ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, description_en: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.slug}</span>
            <input
              className={fieldClass}
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                setForm((current) => ({ ...current, slug: event.target.value }));
              }}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.brand}</span>
            <select
              className={fieldClass}
              value={form.brand || ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, brand: Number(event.target.value) }))
              }
              required
            >
              <option value="">{t.admin.choose}</option>
              {(brands.data ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setBrandError('');
                setBrandFormOpen((isOpen) => !isOpen);
              }}
              className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-black hover:underline"
            >
              {brandFormOpen ? t.admin.cancel : `+ ${t.admin.addBrand}`}
            </button>
            {brandFormOpen ? (
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#e7eaf0] p-3">
                <input
                  className={fieldClass}
                  value={brandName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setBrandName(value);
                    if (!brandSlugEdited) setBrandSlug(slugify(value));
                  }}
                  placeholder={t.admin.brand}
                  aria-label={t.admin.brand}
                  required
                />
                <input
                  className={fieldClass}
                  value={brandSlug}
                  onChange={(event) => {
                    setBrandSlugEdited(true);
                    setBrandSlug(event.target.value);
                  }}
                  placeholder={t.admin.brandSlug}
                  aria-label={t.admin.brandSlug}
                  required
                />
                {brandError ? <p className="m-0 text-sm text-red-600">{brandError}</p> : null}
                <button
                  type="button"
                  onClick={() => void onCreateBrand()}
                  disabled={createBrandState.isLoading}
                  className={adminButton}
                >
                  {createBrandState.isLoading ? t.common.loading : t.admin.createBrand}
                </button>
              </div>
            ) : null}
          </label>
          <label className="block">
            <span className={labelClass}>{t.admin.subcategory}</span>
            <select
              className={fieldClass}
              value={form.subcategory || ''}
              onChange={(event) => {
                const subcategoryId = Number(event.target.value);
                const nextSubcategory = subcategories.data?.find(
                  (item) => item.id === subcategoryId,
                );
                const nextCategory = categories.data?.find(
                  (item) => item.id === nextSubcategory?.category,
                );
                const nextSizeType = expectedSizeType(nextCategory, nextSubcategory);
                setForm((current) => ({ ...current, subcategory: subcategoryId }));
                if (nextSizeType) {
                  setOffers((current) =>
                    current.map((offer) => ({
                      ...offer,
                      size: sizes.data?.some(
                        (size) => String(size.id) === offer.size && size.size_type === nextSizeType,
                      )
                        ? offer.size
                        : '',
                    })),
                  );
                }
              }}
              required
            >
              <option value="">{t.admin.choose}</option>
              {(subcategories.data ?? []).map((item) => {
                const parentCategory = categories.data?.find(
                  (category) => category.id === item.category,
                );
                const parentName =
                  (locale === 'uk' ? parentCategory?.name_uk : parentCategory?.name_en) ||
                  parentCategory?.name;
                const subcategoryName =
                  (locale === 'uk' ? item.name_uk : item.name_en) || item.name;
                return (
                  <option key={item.id} value={item.id}>
                    {parentName ? `${parentName} — ${subcategoryName}` : subcategoryName}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
      </section>

      <section className={cardClass}>
        <div className={cardHead}>
          <h2 className="m-0 text-base font-bold">{t.admin.variantsTitle}</h2>
        </div>
        <div className={`${cardPad} flex flex-col gap-3`}>
          {offers.map((row, index) => {
            const swatch =
              (colors.data ?? []).find((color) => String(color.id) === row.color)?.hex_code ||
              '#eef1f6';
            return (
              <article key={row.key} className="rounded-2xl bg-[#f6f7fb] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-[#9aa1ad]">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={t.admin.removePhoto}
                    onClick={() =>
                      setOffers((current) =>
                        current.length === 1
                          ? [emptyOffer()]
                          : current.filter((item) => item.key !== row.key),
                      )
                    }
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[#6b7280] shadow-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <label className="block">
                    <span className={labelClass}>{t.admin.priceUah}</span>
                    <input
                      className={`${fieldClass} bg-white`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.priceUah}
                      onChange={(event) => setOffer(row.key, { priceUah: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>{t.admin.priceUsd}</span>
                    <input
                      className={`${fieldClass} bg-white`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.priceUsd}
                      onChange={(event) => setOffer(row.key, { priceUsd: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>{t.admin.size}</span>
                    <select
                      className={`${fieldClass} bg-white`}
                      value={row.size}
                      onChange={(event) => setOffer(row.key, { size: event.target.value })}
                    >
                      <option value="">{t.admin.choose}</option>
                      {availableSizes.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>{t.admin.stock}</span>
                    <input
                      className={`${fieldClass} bg-white`}
                      type="number"
                      min="0"
                      step="1"
                      value={row.stock ?? 0}
                      onChange={(event) =>
                        setOffer(row.key, { stock: Number(event.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>{t.admin.color}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-9 shrink-0 rounded-full border border-black/10"
                        style={{ background: swatch }}
                      />
                      <select
                        className={`${fieldClass} bg-white`}
                        value={row.color}
                        onChange={(event) => setOffer(row.key, { color: event.target.value })}
                      >
                        <option value="">{t.admin.choose}</option>
                        {(colors.data ?? []).map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                </div>
                <div className="mt-4 border-t border-[#e5e9f1] pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#1d2433]">
                      {t.admin.discountTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => addDiscount(row)}
                      className={adminButtonCompact}
                    >
                      + {t.admin.addDiscount}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {discountRows
                      .filter(
                        (discount) =>
                          discount.variantId === row.remoteId || discount.offerKey === row.key,
                      )
                      .map((discount) => (
                        <div
                          key={discount.key}
                          className="grid grid-cols-2 gap-3 rounded-xl bg-white p-3 md:grid-cols-4"
                        >
                          <label className="block">
                            <span className={labelClass}>{t.admin.discountPercent}</span>
                            <input
                              className={fieldClass}
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={discount.amount}
                              onChange={(event) =>
                                setDiscount(discount.key, { amount: event.target.value })
                              }
                              placeholder="%"
                            />
                          </label>
                          <label className="block">
                            <span className={labelClass}>{t.admin.discountStart}</span>
                            <input
                              className={fieldClass}
                              type="datetime-local"
                              value={discount.startAt}
                              onChange={(event) =>
                                setDiscount(discount.key, { startAt: event.target.value })
                              }
                            />
                          </label>
                          <label className="block">
                            <span className={labelClass}>{t.admin.discountEnd}</span>
                            <input
                              className={fieldClass}
                              type="datetime-local"
                              value={discount.endAt}
                              onChange={(event) =>
                                setDiscount(discount.key, { endAt: event.target.value })
                              }
                            />
                          </label>
                          <div className="flex items-end justify-between gap-2">
                            <label className="inline-flex h-11 cursor-pointer items-center gap-2 text-sm text-[#6b7280]">
                              <input
                                type="checkbox"
                                checked={discount.isActive}
                                onChange={(event) =>
                                  setDiscount(discount.key, { isActive: event.target.checked })
                                }
                              />
                              {t.admin.discountActive}
                            </label>
                            <button
                              type="button"
                              aria-label={t.admin.removeDiscount}
                              onClick={() =>
                                setDiscountRows((current) =>
                                  current.filter((item) => item.key !== discount.key),
                                )
                              }
                              className="mb-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-[#f3f4f6] text-[#6b7280]"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            onClick={() => setOffers((current) => [...current, emptyOffer()])}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-5 text-sm text-black transition-colors hover:border-black"
          >
            + {t.admin.addVariant}
          </button>
        </div>
      </section>

      <section
        className={`${cardClass} ${cardPad} flex flex-wrap items-center justify-between gap-4`}
      >
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex h-11 cursor-pointer items-center rounded-lg px-5 text-sm ${
              form.is_active
                ? 'bg-black text-white'
                : 'border border-neutral-300 bg-white text-neutral-500'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            {t.admin.active}
          </label>
          <label
            className={`inline-flex h-11 cursor-pointer items-center rounded-lg px-5 text-sm ${
              form.is_hidden
                ? 'bg-black text-white'
                : 'border border-neutral-300 bg-white text-neutral-500'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_hidden}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_hidden: event.target.checked }))
              }
            />
            {t.admin.hidden}
          </label>
        </div>
        <div className="flex items-center gap-4">
          {error ? <p className="m-0 text-sm text-[#ef4444]">{error}</p> : null}
          <button type="submit" disabled={saving} className={adminButton}>
            {saving ? t.common.saving : t.admin.save}
          </button>
        </div>
      </section>
    </form>
  );
}

export default function AdminProductForm({ productId }: { productId?: number }) {
  const { t } = useTranslation();
  const product = useGetAdminProductByIdQuery(productId ?? skipToken);
  const isEdit = typeof productId === 'number';

  if (isEdit && product.isLoading) {
    return <p className="m-0 text-sm text-[#6b7280]">{t.common.loading}</p>;
  }

  if (isEdit && (product.isError || !product.data)) {
    return <p className="m-0 text-sm text-[#ef4444]">{t.admin.loadError}</p>;
  }

  const initial: ProductWriteInput = product.data
    ? {
        name: product.data.name ?? '',
        name_uk: product.data.name_uk ?? product.data.name ?? '',
        name_en: product.data.name_en ?? product.data.name ?? '',
        slug: product.data.slug ?? '',
        description: product.data.description ?? '',
        description_uk: product.data.description_uk ?? product.data.description ?? '',
        description_en: product.data.description_en ?? product.data.description ?? '',
        brand: product.data.brand ?? 0,
        subcategory: product.data.subcategory ?? 0,
        is_active: product.data.is_active !== false,
        is_hidden: Boolean(product.data.is_hidden),
      }
    : emptyProduct;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-[#9aa1ad] no-underline hover:text-black"
        >
          ← {t.admin.backToProducts}
        </Link>
        <h1 className="m-0 mt-2 text-[28px] leading-tight font-bold">
          {isEdit ? t.admin.editProduct : t.admin.addProduct}
        </h1>
      </div>
      <ProductFields
        key={product.data?.id ?? 'new'}
        initial={initial}
        initialVariants={product.data?.variants}
        productId={productId}
      />
    </div>
  );
}
