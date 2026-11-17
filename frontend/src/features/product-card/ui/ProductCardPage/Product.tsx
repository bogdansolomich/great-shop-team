'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProductShowcase from '@/widgets/ProductShowcase/ProductShowcase';
// import ProductReviews from '@/widgets/ProductReviews/ProductReviews';
import { getColorLabel } from '@/i18n/colorLabel';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { isCatalogListingSlug } from '@/features/catalog/model/catalogCategory';
import ClothingProductCard from '@/features/catalog/ui/CatalogProductCard/CatalogProductCard';
import { buildProductHref } from '@/features/catalog/lib/buildProductHref';
import { mapApiProductToCatalogCard } from '@/features/catalog/lib/mapApiProductToCatalogCard';
import { resolveVariantPrice } from '@/features/catalog/lib/resolveVariantOffer';
import { discountBadge, isDiscountCurrent, salePrice } from '@/features/sales/lib/saleOffer';

import {
  buildVariantColorOptions,
  buildVariantSizeOptions,
  findMatchingVariant,
  getImagesForVariant,
} from '@/features/product-card/lib/resolveSelectedVariant';

import { toImageUrl } from '@/store/api/mappers/products.mapper';

import {
  useGetColorsQuery,
  useGetCurrenciesQuery,
  useGetProductImagesQuery,
  useGetProductVariantsQuery,
  useGetSizesQuery,
} from '@/store/endpoints/catalogMetaEndpoints';

import {
  useGetProductDetailsBySlugOrIdQuery,
  useGetSimilarProductsQuery,
} from '@/store/endpoints/productsEndpoints';

import { useGetBrandByIdQuery } from '@/store/endpoints/brandsEndpoints';
import { useGetDiscountsQuery } from '@/store/endpoints/discountsEndpoints';

import {
  useGetCategoryByIdQuery,
  useGetSubcategoryByIdQuery,
} from '@/store/endpoints/categoriesEndpoints';

import type { ProductImageRecord } from '@/store/types';

const formatMetaLabel = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildShowcaseImages = (params: {
  title: string;
  images: ProductImageRecord[];
  imageAlt: {
    front: string;
    back: string;
    gallery: string;
  };
  fallbackSrc: string;
}) => {
  const { title, images, imageAlt, fallbackSrc } = params;

  const allImageUrls = [...images]
    .sort((a, b) => {
      const orderA = typeof a.sort_order === 'number' ? a.sort_order : 0;
      const orderB = typeof b.sort_order === 'number' ? b.sort_order : 0;

      if (orderA !== orderB) return orderA - orderB;
      if (a.is_main === b.is_main) return 0;

      return a.is_main ? -1 : 1;
    })
    .map((item) => toImageUrl(item.image))
    .filter(Boolean);

  const uniqueImageUrls = allImageUrls.filter((src, index, array) => array.indexOf(src) === index);

  const displayImageUrls = uniqueImageUrls.length ? uniqueImageUrls : [fallbackSrc];
  const frontImage = displayImageUrls[0] ?? '';
  const backImage = displayImageUrls[1] ?? frontImage;

  const galleryImages =
    displayImageUrls.slice(2).length > 0 ? displayImageUrls.slice(2) : displayImageUrls;

  return {
    main: {
      front: {
        src: frontImage,
        alt: formatMessage(imageAlt.front, { title }),
      },
      back: {
        src: backImage,
        alt: formatMessage(imageAlt.back, { title }),
      },
    },
    gallery: galleryImages.map((image, index) => ({
      src: image,
      alt: formatMessage(imageAlt.gallery, {
        title,
        n: index + 1,
      }),
    })),
  };
};

export default function Product() {
  const { t, locale } = useTranslation();

  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slugOrId = (params.id ?? params.slug) as string;

  // A catalog card filtered by color links here with `?color=<id>` so that color opens first.
  const requestedColorId = Number(searchParams.get('color') ?? Number.NaN);

  // ==========================================
  // PRODUCT QUERY
  // ==========================================

  const {
    data: product,
    error: productError,
    isError: isProductError,
    isLoading: isProductLoading,
    isFetching: isProductFetching,
    isUninitialized: isProductUninitialized,
    refetch: refetchProduct,
  } = useGetProductDetailsBySlugOrIdQuery(slugOrId, {
    skip: !slugOrId,
    refetchOnMountOrArgChange: true,
  });

  // ==========================================
  // PRODUCT TRANSLATIONS
  // ==========================================

  const localizedProductName = product
    ? locale === 'en'
      ? product.name_en || product.name
      : product.name_uk || product.name
    : '';

  const localizedProductDescription = product
    ? locale === 'en'
      ? product.description_en || product.description
      : product.description_uk || product.description
    : '';

  // ==========================================
  // RELATED PRODUCTS QUERY
  // ==========================================

  const { data: similarRaw } = useGetSimilarProductsQuery(
    {
      productId: Number(product?.id),
      subcategoryId: Number(product?.subcategory),
    },
    { skip: !product },
  );

  // ==========================================
  // CATALOG META QUERIES
  // ==========================================

  const {
    data: variantsRaw = [],
    isLoading: isVariantsLoading,
    isFetching: isVariantsFetching,
  } = useGetProductVariantsQuery();

  const {
    data: imagesRaw = [],
    isLoading: isImagesLoading,
    isFetching: isImagesFetching,
  } = useGetProductImagesQuery();

  const { data: currenciesRaw = [] } = useGetCurrenciesQuery();
  const { data: discounts = [] } = useGetDiscountsQuery();

  const {
    data: sizesRaw = [],
    isLoading: isSizesLoading,
    isFetching: isSizesFetching,
  } = useGetSizesQuery();

  const {
    data: colorsRaw = [],
    isLoading: isColorsLoading,
    isFetching: isColorsFetching,
  } = useGetColorsQuery();

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // ==========================================
  // BRAND / CATEGORY QUERIES
  // ==========================================

  const { data: brand } = useGetBrandByIdQuery(product?.brand ?? 0, {
    skip: !product,
  });

  const { data: subcategory } = useGetSubcategoryByIdQuery(product?.subcategory ?? 0, {
    skip: !product,
  });

  const { data: category } = useGetCategoryByIdQuery(subcategory?.category ?? 0, {
    skip: !subcategory,
  });

  // ==========================================
  // PRODUCT VARIANTS
  // ==========================================

  const productVariants = useMemo(() => {
    if (!product) return [];

    return variantsRaw.filter(
      (variant) => Number(variant.product) === Number(product.id) && variant.is_active !== false,
    );
  }, [product, variantsRaw]);

  const productVariantIds = useMemo(
    () => new Set(productVariants.map((variant) => Number(variant.id))),
    [productVariants],
  );

  const productImages = useMemo(() => {
    if (!product) return [];

    return imagesRaw.filter((image) => productVariantIds.has(Number(image.product_variant)));
  }, [imagesRaw, product, productVariantIds]);

  // ==========================================
  // SELECTED VARIANT
  // ==========================================

  const selectedVariant = useMemo(() => {
    if (selectedVariantId != null) {
      const current = productVariants.find((variant) => Number(variant.id) === selectedVariantId);

      if (current) return current;
    }

    const preferredCurrency = locale === 'uk' ? 'UAH' : 'USD';
    const requestedColorVariants = productVariants.filter(
      (variant) => variant.color != null && Number(variant.color) === requestedColorId,
    );
    const candidates = requestedColorVariants.length > 0 ? requestedColorVariants : productVariants;
    const cheapest = [...candidates].sort((left, right) => {
      const baseLeftPrice =
        resolveVariantPrice({ variants: [left], currencies: currenciesRaw, preferredCurrency })
          ?.amount ?? Number.POSITIVE_INFINITY;
      const baseRightPrice =
        resolveVariantPrice({ variants: [right], currencies: currenciesRaw, preferredCurrency })
          ?.amount ?? Number.POSITIVE_INFINITY;
      const leftPrice = discounts
        .filter(
          (discount) =>
            Number(discount.product_variant) === Number(left.id) && isDiscountCurrent(discount),
        )
        .reduce(
          (best, discount) => Math.min(best, salePrice(baseLeftPrice, discount)),
          baseLeftPrice,
        );
      const rightPrice = discounts
        .filter(
          (discount) =>
            Number(discount.product_variant) === Number(right.id) && isDiscountCurrent(discount),
        )
        .reduce(
          (best, discount) => Math.min(best, salePrice(baseRightPrice, discount)),
          baseRightPrice,
        );
      return leftPrice - rightPrice;
    })[0];

    return cheapest ?? findMatchingVariant({ variants: productVariants });
  }, [currenciesRaw, discounts, locale, productVariants, requestedColorId, selectedVariantId]);

  const selectedVariantImages = useMemo(
    () =>
      getImagesForVariant(
        productImages,
        selectedVariant ? Number(selectedVariant.id) : undefined,
        productVariants,
      ),
    [productImages, productVariants, selectedVariant],
  );

  // ==========================================
  // SHOWCASE IMAGES
  // ==========================================

  const showcaseImages = useMemo(() => {
    if (!product) return null;

    return buildShowcaseImages({
      title: localizedProductName,
      images: selectedVariantImages,
      imageAlt: t.product.imageAlt,
      fallbackSrc:
        locale === 'uk'
          ? '/images/catalog/photo-placeholder-uk.svg'
          : '/images/catalog/photo-placeholder-en.svg',
    });
  }, [locale, product, localizedProductName, selectedVariantImages, t.product.imageAlt]);

  // ==========================================
  // PRICE
  // ==========================================

  const offerPrice = useMemo(
    () =>
      resolveVariantPrice({
        variants: selectedVariant ? [selectedVariant] : [],
        currencies: currenciesRaw,
        preferredCurrency: locale === 'uk' ? 'UAH' : 'USD',
      }),
    [currenciesRaw, locale, selectedVariant],
  );
  const promotion = useMemo(() => {
    if (!selectedVariant || !offerPrice) return undefined;
    const activeDiscounts = discounts
      .filter(
        (discount) =>
          Number(discount.product_variant) === Number(selectedVariant.id) &&
          isDiscountCurrent(discount),
      )
      .map((discount) => ({
        discount,
        price: salePrice(offerPrice.amount, discount),
      }))
      .filter((offer) => offer.price < offerPrice.amount)
      .sort((left, right) => left.price - right.price);
    const best = activeDiscounts[0];
    if (!best) return undefined;
    return {
      current: best.price,
      compareAt: offerPrice.amount,
      badge: discountBadge(best.discount, locale, offerPrice.currency),
    };
  }, [discounts, locale, offerPrice, selectedVariant]);

  // ==========================================
  // SIZE OPTIONS
  // ==========================================

  const sizeOptions = useMemo(
    () =>
      buildVariantSizeOptions({
        variants: productVariants,
        sizes: sizesRaw,
      }),
    [productVariants, sizesRaw],
  );

  // ==========================================
  // COLOR OPTIONS
  // ==========================================

  const colorOptions = useMemo(() => {
    if (!product) return [];

    return buildVariantColorOptions({
      variants: productVariants,
      colors: colorsRaw,
      images: productImages,
    }).map((option) => ({
      ...option,
      alt: formatMessage(t.product.imageAlt.color, {
        title: localizedProductName,
        color: getColorLabel(option.name, t.colors),
      }),
    }));
  }, [
    colorsRaw,
    product,
    localizedProductName,
    productImages,
    productVariants,
    t.colors,
    t.product.imageAlt.color,
  ]);

  // ==========================================
  // SELECT SIZE
  // ==========================================

  const handleSelectSize = useCallback(
    (sizeId: number) => {
      const nextVariant = findMatchingVariant({
        variants: productVariants,
        sizeId,
        colorId: selectedVariant ? Number(selectedVariant.color) : undefined,
        prefer: 'size',
      });

      if (nextVariant) {
        setSelectedVariantId(Number(nextVariant.id));
      }
    },
    [productVariants, selectedVariant],
  );

  // ==========================================
  // SELECT COLOR
  // ==========================================

  const handleSelectColor = useCallback(
    (colorId: number) => {
      const nextVariant = findMatchingVariant({
        variants: productVariants,
        sizeId: selectedVariant ? Number(selectedVariant.size) : undefined,
        colorId,
        prefer: 'color',
      });

      if (nextVariant) {
        setSelectedVariantId(Number(nextVariant.id));
      }
    },
    [productVariants, selectedVariant],
  );

  // ==========================================
  // RELATED PRODUCTS
  // ==========================================

  const relatedProducts = useMemo(() => {
    if (!product || !similarRaw) return [];

    const routeCategory = pathname?.split('/')[2] ?? 'women';

    const cardCategory = isCatalogListingSlug(routeCategory) ? routeCategory : 'women';

    const currentGenders = new Set(
      similarRaw.variants
        .filter((variant) => Number(variant.product) === Number(product.id) && variant.is_active)
        .map((variant) => variant.gender),
    );

    const ranked = [...similarRaw.products].sort((left, right) => {
      const score = (itemId: number) => {
        if (currentGenders.size === 0) return 0;

        const genders = similarRaw.variants
          .filter((variant) => Number(variant.product) === itemId && variant.is_active)
          .map((variant) => variant.gender);

        return genders.some((gender) => currentGenders.has(gender)) ? 0 : 1;
      };

      return score(Number(left.id)) - score(Number(right.id));
    });

    return ranked.slice(0, 3).map((item) => {
      const card = mapApiProductToCatalogCard({
        product: item,
        category: cardCategory,
        locale,
        brandById: new Map(),
        subcategoryById: new Map(),
        variants: similarRaw.variants,
        colorsById: new Map(),
        sizesById: new Map(),
        images: similarRaw.images,
        currencies: currenciesRaw,
        discounts,
      });

      return {
        ...card,
        href: buildProductHref(routeCategory, item),
      };
    });
  }, [currenciesRaw, discounts, locale, pathname, product, similarRaw]);

  // ==========================================
  // BREADCRUMBS
  // ==========================================

  const breadcrumbs = useMemo(() => {
    if (!product || !pathname) return [];

    const routeCategory = pathname.split('/')[2] ?? 'catalog';

    const categoryLabel = isCatalogListingSlug(routeCategory)
      ? t.catalog.categories[routeCategory].navLabel
      : formatMetaLabel(category?.name || routeCategory);

    return [
      {
        href: '/',
        label: t.common.home,
      },
      {
        href: `/catalog/${routeCategory}`,
        label: categoryLabel,
      },
      {
        label: localizedProductName,
        current: true,
      },
    ];
  }, [
    category?.name,
    pathname,
    product,
    localizedProductName,
    t.catalog.categories,
    t.common.home,
  ]);

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  const productErrorStatus =
    productError && typeof productError === 'object' && 'status' in productError
      ? productError.status
      : undefined;

  const isPending = !slugOrId || isProductUninitialized || isProductLoading || isProductFetching;

  const shouldRedirectToNotFound =
    !isPending &&
    ((isProductError && productErrorStatus === 404) || (!isProductError && product === null));

  const redirectedSlug = useRef<string | null>(null);

  const [trackedSlug, setTrackedSlug] = useState(slugOrId);
  const [productRetryCount, setProductRetryCount] = useState(0);

  if (trackedSlug !== slugOrId) {
    setTrackedSlug(slugOrId);
    setProductRetryCount(0);
  }

  // ==========================================
  // UPDATE PRODUCT URL
  // ==========================================

  useEffect(() => {
    if (!product?.slug || !pathname || !slugOrId) return;
    if (slugOrId === product.slug) return;

    const segments = pathname.split('/');
    const lastIndex = segments.length - 1;

    if (!segments[lastIndex]) return;

    segments[lastIndex] = product.slug;

    router.replace(segments.join('/'));
  }, [pathname, product, router, slugOrId]);

  // ==========================================
  // RETRY PRODUCT REQUEST
  // ==========================================

  useEffect(() => {
    if (!isProductError || !slugOrId || productRetryCount >= 2) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProductRetryCount((count) => count + 1);
      refetchProduct();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [isProductError, productRetryCount, refetchProduct, slugOrId]);

  // ==========================================
  // REDIRECT TO 404
  // ==========================================

  useEffect(() => {
    if (!shouldRedirectToNotFound || !slugOrId) return;
    if (redirectedSlug.current === slugOrId) return;

    redirectedSlug.current = slugOrId;

    window.location.replace('/404');
  }, [shouldRedirectToNotFound, slugOrId]);

  // ==========================================
  // LOADING STATES
  // ==========================================

  if (isPending) {
    return <div>{t.common.loading}</div>;
  }

  if (shouldRedirectToNotFound) {
    return <div>{t.common.loading}</div>;
  }

  if (isProductError) {
    if (productRetryCount < 2) {
      return <div>{t.common.loading}</div>;
    }

    return (
      <button
        type="button"
        className="mx-auto block cursor-pointer border-0 bg-transparent py-16 text-center text-dark/70"
        onClick={() => refetchProduct()}
      >
        {t.catalog.loadError}
      </button>
    );
  }

  const isMetaPending =
    isVariantsLoading ||
    isVariantsFetching ||
    isImagesLoading ||
    isImagesFetching ||
    isSizesLoading ||
    isSizesFetching ||
    isColorsLoading ||
    isColorsFetching;

  if (!product || isMetaPending || !showcaseImages) {
    return <div>{t.common.loading}</div>;
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>
      <ProductShowcase
        brand={formatMetaLabel(brand?.name || 'Brand')}
        title={localizedProductName}
        description={localizedProductDescription ? [localizedProductDescription] : []}
        price={{
          current: offerPrice?.amount ?? 0,
          currency: offerPrice?.currency ?? 'USD',
        }}
        promotion={promotion}
        code={selectedVariant?.sku || String(product.id)}
        // rating={5}
        sizes={sizeOptions}
        selectedSizeId={selectedVariant ? Number(selectedVariant.size) : undefined}
        onSelectSize={handleSelectSize}
        colors={colorOptions}
        selectedColorId={selectedVariant ? Number(selectedVariant.color) : undefined}
        onSelectColor={handleSelectColor}
        rating={5}
        images={showcaseImages}
        breadcrumbs={breadcrumbs}
        productId={String(product.id)}
        variantId={selectedVariant ? Number(selectedVariant.id) : undefined}
        link={{
          href: buildProductHref(pathname?.split('/')[2] ?? 'catalog', product),
          label: localizedProductName,
        }}
      />

      {/* <ProductReviews /> */}

      {relatedProducts.length > 0 ? (
        <div className="mb-16">
          <h2 className="mb-6 text-[24px] font-normal md:mb-8 md:text-[36px]">
            {t.product.youMayAlsoLike}
          </h2>

          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-5">
            {relatedProducts.map((item) => (
              <ClothingProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
