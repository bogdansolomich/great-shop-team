'use client';

import Image from 'next/image';
import Link from 'next/link';
// import StarRating from '@/widgets/StarRating/StarRating';
import WishlistButton from '@/features/wishlist/ui/WishlistButton/WishlistButton';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { formatLocalizedPrice } from '@/features/catalog/lib/resolveVariantOffer';
import { useCartDrawer } from '@/features/cart/context/CartDrawerContext';
import { useTranslation } from '@/i18n/useTranslation';
import { addToCart } from '@/store/slices/cartSlice';
import ProductMainImageZoom from './ProductMainImageZoom';

interface ProductShowcaseProps {
  brand: string;
  title: string;
  description: string[];
  price: {
    current: number;
    currency: string;
  };
  promotion?: {
    current: number;
    compareAt: number;
    badge: string;
  };
  code: string;
  rating?: number;
  sizes: {
    id: number;
    name: string;
  }[];
  selectedSizeId?: number;
  onSelectSize?: (sizeId: number) => void;
  colors: {
    id: number;
    name: string;
    src: string;
    hex: string;
    alt: string;
  }[];
  selectedColorId?: number;
  onSelectColor?: (colorId: number) => void;

  images: {
    main: {
      front: { src: string; alt: string };
      back: { src: string; alt: string };
    };
    gallery: { src: string; alt: string }[];
  };

  link: {
    href: string;
    label: string;
  };

  breadcrumbs: {
    label: string;
    href?: string;
    current?: boolean;
  }[];
  productId?: string;
  variantId?: number;
}

const IMAGE_MODAL_ANIMATION_DURATION_MS = 360;

export default function ProductShowcase({
  brand,
  title,
  description,
  price,
  promotion,
  code,
  images,
  sizes,
  selectedSizeId,
  onSelectSize,
  colors,
  selectedColorId,
  onSelectColor,
  breadcrumbs,
  productId,
  variantId,
}: ProductShowcaseProps) {
  const { t, locale } = useTranslation();
  const dispatch = useDispatch();
  const { openCart } = useCartDrawer();

  const addCurrentProductToCart = () => {
    const numericProductId = Number(productId);
    if (!Number.isFinite(numericProductId)) return false;

    const sizeLabel = sizes.find((item) => item.id === selectedSizeId)?.name ?? '';
    const colorLabel = colors.find((item) => item.id === selectedColorId)?.name ?? '';

    dispatch(
      addToCart({
        productId: numericProductId,
        variantId: variantId ?? 0,
        quantity: 1,
        brand,
        title,
        price: price.current,
        currency: price.currency,
        imageSrc: images.main.front.src,
        imageAlt: images.main.front.alt,
        sku: code,
        color: colorLabel,
        size: sizeLabel,
      }),
    );

    return true;
  };

  const infoTabs = useMemo(
    () => [
      { id: 'qualityCare', ...t.product.infoTabs.qualityCare },
      { id: 'deliveryReturns', ...t.product.infoTabs.deliveryReturns },
    ],
    [t],
  );

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isImageModalRendered, setIsImageModalRendered] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openTabs, setOpenTabs] = useState<Record<string, boolean>>({});

  const previewImages = useMemo(() => {
    const allImages = [images.main.front, images.main.back, ...images.gallery].filter(
      (item) => item.src,
    );

    const uniqueImages = allImages.filter(
      (item, index, array) => array.findIndex((candidate) => candidate.src === item.src) === index,
    );

    return uniqueImages.length > 0 ? uniqueImages : [images.main.front].filter((item) => item.src);
  }, [images]);

  const galleryPreviewImages =
    images.gallery.length > 0 ? images.gallery : [images.main.front].filter((item) => item.src);

  const hasMultiplePreviewImages = previewImages.length > 1;

  const imageSetKey = `${images.main.front.src}|${images.main.back.src}`;
  const [activeImageSetKey, setActiveImageSetKey] = useState(imageSetKey);
  const isNewImageSet = activeImageSetKey !== imageSetKey;

  if (isNewImageSet) {
    setActiveImageSetKey(imageSetKey);
    setActivePreviewIndex(0);
    setSelectedImageIndex(0);
  }

  const activePreviewImage =
    previewImages[isNewImageSet ? 0 : activePreviewIndex] ?? previewImages[0];
  const displayPrice = formatLocalizedPrice(
    promotion?.current ?? price.current,
    price.currency,
    locale,
  );
  const compareAtPrice = promotion
    ? formatLocalizedPrice(promotion.compareAt, price.currency, locale)
    : null;

  const openImageModal = () => {
    setSelectedImageIndex(activePreviewIndex);

    if (isImageModalRendered) {
      setIsImageModalVisible(true);
      return;
    }

    setIsImageModalRendered(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsImageModalVisible(true);
      });
    });
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
  };

  const handleShowPreviousImage = () => {
    if (!hasMultiplePreviewImages) {
      return;
    }

    setSelectedImageIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1));
  };

  const handleShowNextImage = () => {
    if (!hasMultiplePreviewImages) {
      return;
    }

    setSelectedImageIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1));
  };

  const handleToggleTab = (tabId: string) => {
    setOpenTabs((prev) => ({ ...prev, [tabId]: !prev[tabId] }));
  };

  useEffect(() => {
    document.body.style.overflow = isImageModalRendered ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isImageModalRendered]);

  useEffect(() => {
    if (!isImageModalRendered || isImageModalVisible) {
      return;
    }

    const closeTimeout = window.setTimeout(() => {
      setIsImageModalRendered(false);
    }, IMAGE_MODAL_ANIMATION_DURATION_MS);

    return () => {
      window.clearTimeout(closeTimeout);
    };
  }, [isImageModalRendered, isImageModalVisible]);

  useEffect(() => {
    if (!isImageModalRendered) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImageModal();
      }

      if (event.key === 'ArrowLeft' && hasMultiplePreviewImages) {
        setSelectedImageIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1));
      }

      if (event.key === 'ArrowRight' && hasMultiplePreviewImages) {
        setSelectedImageIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultiplePreviewImages, isImageModalRendered, previewImages.length]);

  return (
    <section className="mb-16 pt-4 md:mb-24 md:pt-10.5">
      <nav
        aria-label={t.product.aria.breadcrumb}
        className="mb-6 flex flex-wrap items-center gap-1.5 text-sm leading-[1.2] text-black/70 md:mb-10 md:gap-2 md:text-[16px]"
      >
        {breadcrumbs.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !item.current ? (
              <Link href={item.href} className="transition-opacity duration-200 hover:opacity-100">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}

            {index < breadcrumbs.length - 1 ? <span>/</span> : null}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-8 xl:flex-row xl:gap-16">
        <div className="w-full max-w-157.5 shrink-0">
          <div className="relative flex min-h-80 items-center justify-center overflow-hidden bg-[#f3f3f3] sm:min-h-105 md:min-h-132.75">
            {activePreviewImage ? (
              <ProductMainImageZoom src={activePreviewImage.src} alt={activePreviewImage.alt}>
                <button
                  type="button"
                  className="absolute right-3 bottom-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white-fa transition-transform duration-200 hover:scale-105 md:right-4 md:bottom-4 md:h-12 md:w-12"
                  onClick={(event) => {
                    event.stopPropagation();
                    openImageModal();
                  }}
                  aria-label={t.product.aria.openGallery}
                >
                  <Image src="/icons/plus-sign-in-a-circle.svg" alt="" width={28} height={28} />
                </button>
              </ProductMainImageZoom>
            ) : null}
          </div>

          <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:gap-4 [&::-webkit-scrollbar]:hidden">
            {galleryPreviewImages.map((item, index) => (
              <button
                type="button"
                key={`${item.src}-${index}`}
                className="flex h-36 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-[#f3f3f3] p-2 transition-transform duration-300 hover:-translate-y-0.5 md:h-52 md:w-36.25 md:p-4"
                onClick={() =>
                  setActivePreviewIndex(
                    Math.max(
                      0,
                      previewImages.findIndex((previewImage) => previewImage.src === item.src),
                    ),
                  )
                }
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={145}
                  height={208}
                  className={`h-full w-full object-contain transition-opacity duration-200 ${
                    activePreviewImage?.src === item.src ? 'opacity-100' : 'opacity-75'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="w-full flex-1 xl:max-w-130 xl:pt-1">
          <p className="mb-2 font-sans text-[16px] font-normal text-black">{brand}</p>
          <div className="mb-4 flex items-start justify-between gap-3 md:mb-6 md:gap-6">
            <div className="min-w-0">
              <h1 className="mb-0 text-[22px] leading-[1.2] font-bold md:max-w-[320px] md:text-[24px]">
                {title}
              </h1>
            </div>
            <div className="shrink-0 pt-1 text-right whitespace-nowrap">
              {promotion?.badge ? (
                <span className="mb-1 inline-flex rounded-full bg-[#fff1f0] px-2.5 py-1 text-xs font-semibold text-[#d83b48]">
                  {promotion.badge}
                </span>
              ) : null}
              <p
                className={`m-0 text-[20px] leading-[120%] font-light md:min-w-18 md:text-[24px] ${
                  promotion ? 'text-[#d83b48]' : 'text-black'
                }`}
                style={{ fontFamily: 'var(--second-family)' }}
              >
                {displayPrice}
              </p>
              {compareAtPrice ? (
                <p className="m-0 text-sm text-black/45 line-through">{compareAtPrice}</p>
              ) : null}
            </div>
          </div>

          <div className="mb-4 max-w-82.5 font-sans text-[16px] leading-6 text-black/80">
            {description.map((item, key) => (
              <p className="mb-3" key={key}>
                {item}
              </p>
            ))}
          </div>

          <p className="mb-4 font-sans text-[16px] leading-[1.2] text-black/70">
            {t.product.productCode}
            {code}
          </p>

          {/* <div className="mb-5">
            <StarRating count={rating} />
          </div> */}

          <div className="mb-3 flex flex-wrap gap-2">
            {sizes.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectSize?.(item.id)}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border border-black px-3 font-sans text-[14px] leading-none transition-colors duration-200 ${
                  item.id === selectedSizeId ? 'bg-black text-white-fa' : 'bg-white text-black'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {colors.length > 0 ? (
            <>
              <p className="mb-3 font-sans text-[16px] leading-[1.2] text-black">
                {t.product.color}
              </p>
              <div className="mb-8 flex flex-wrap gap-4">
                {colors.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onSelectColor?.(item.id)}
                    className={`overflow-hidden border-b pb-1 transition-colors duration-200 ${
                      item.id === selectedColorId ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    {item.src ? (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={112}
                        height={124}
                        className="h-24 w-20 object-contain bg-[#f3f3f3] md:h-31 md:w-28"
                      />
                    ) : (
                      <span
                        role="img"
                        aria-label={item.alt}
                        className="flex h-24 w-20 items-center justify-center bg-[#f3f3f3] md:h-31 md:w-28"
                      >
                        <span
                          className="size-10 rounded-full border border-black/10"
                          style={{ backgroundColor: item.hex }}
                        />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div className="mb-6 flex w-full flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/checkout"
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-black bg-black px-6 font-sans text-[16px] font-medium text-white-fa no-underline transition-opacity duration-200 hover:opacity-90 sm:w-auto sm:min-w-35"
              onClick={(event) => {
                if (!addCurrentProductToCart()) event.preventDefault();
              }}
            >
              {t.product.buyNow}
            </Link>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-black px-6 font-sans text-[16px] font-normal text-black transition-colors duration-200 hover:bg-black hover:text-white-fa sm:w-auto sm:min-w-35"
              onClick={() => {
                if (!addCurrentProductToCart()) return;
                openCart();
              }}
            >
              {t.product.addToCart}
            </button>
          </div>

          <div className="flex flex-col border-t border-black/10">
            {infoTabs.map((tab) => {
              const isOpen = Boolean(openTabs[tab.id]);
              const panelId = `product-info-${tab.id}`;

              return (
                <div key={tab.id} className="border-b border-black/10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between bg-transparent py-4 text-left font-sans text-[16px] leading-[1.2] text-black transition-opacity duration-200 hover:opacity-70"
                    onClick={() => handleToggleTab(tab.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span>{tab.label}</span>
                    <span
                      aria-hidden="true"
                      className={`inline-block origin-center text-[20px] leading-none transition-transform duration-300 ease-out ${
                        isOpen ? 'rotate-90' : 'rotate-0'
                      }`}
                    >
                      {'>'}
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`m-0 pb-4 font-sans text-[14px] leading-[1.6] text-black/70 transition-transform duration-300 ease-out ${
                          isOpen ? 'translate-y-0' : 'translate-y-3'
                        }`}
                      >
                        {tab.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isImageModalRendered && previewImages[selectedImageIndex] && (
        <div
          className={`fixed inset-0 z-120 bg-black/20 transition-[opacity,backdrop-filter] duration-360 ease-out ${
            isImageModalVisible ? 'opacity-100 backdrop-blur-[18px]' : 'opacity-0 backdrop-blur-0'
          }`}
          onClick={closeImageModal}
        >
          <div className="relative z-1 h-full overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center px-4 pt-20 pb-10 md:px-6 md:pt-28.5 xl:px-20">
              <button
                type="button"
                className={`fixed top-4 right-4 z-2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black bg-white-fa transition-[transform,opacity] duration-360 ease-out hover:scale-105 md:top-7 md:right-7 ${
                  isImageModalVisible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  closeImageModal();
                }}
                aria-label={t.product.aria.closeGallery}
              >
                <span className="relative block h-5 w-5">
                  <span className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 rotate-45 bg-black" />
                  <span className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 -rotate-45 bg-black" />
                </span>
              </button>

              <div
                className={`w-full max-w-[min(90vw,80rem)] transition-[transform,opacity] duration-360 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isImageModalVisible
                    ? 'translate-y-0 scale-100 opacity-100'
                    : 'translate-y-6 scale-[0.985] opacity-0'
                }`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex w-full flex-col gap-8 xl:flex-row xl:items-start xl:gap-18.5">
                  <div className="flex w-full flex-1 flex-col items-center">
                    <div className="relative flex min-h-80 w-full max-w-full items-center justify-center overflow-hidden bg-white-fa h-[min(52rem,calc(100dvh-10rem))] md:w-[min(52.875rem,calc(100vw-8rem))]">
                      <ProductMainImageZoom
                        src={previewImages[selectedImageIndex].src}
                        alt={previewImages[selectedImageIndex].alt}
                        width={2400}
                        height={3000}
                        sizes="100vw"
                        variant="lightbox"
                        enableClickToggle
                        zoomInLabel={t.product.aria.zoomIn}
                        zoomOutLabel={t.product.aria.zoomOut}
                      >
                        <span className="pointer-events-none absolute right-8 bottom-8 z-10 inline-flex h-12 w-12 items-center justify-center">
                          <Image
                            src="/icons/video-start-arrow.svg"
                            alt={t.product.aria.playPreview}
                            width={48}
                            height={49}
                          />
                        </span>
                      </ProductMainImageZoom>
                    </div>
                    <div className="mt-5 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center disabled:cursor-default disabled:opacity-40"
                        onClick={handleShowPreviousImage}
                        disabled={!hasMultiplePreviewImages}
                        aria-label={t.product.aria.previousImage}
                      >
                        <Image src="/icons/arrow-left.svg" alt="" width={44} height={44} />
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center disabled:cursor-default disabled:opacity-40"
                        onClick={handleShowNextImage}
                        disabled={!hasMultiplePreviewImages}
                        aria-label={t.product.aria.nextImage}
                      >
                        <Image src="/icons/arrow-right.svg" alt="" width={44} height={44} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`w-full shrink-0 transition-[transform,opacity] delay-75 duration-360 ease-out xl:w-49.25 ${
                      isImageModalVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                    }`}
                  >
                    <div className="flex max-h-none flex-row gap-3 overflow-x-auto md:max-h-236 md:gap-4 xl:flex-col xl:gap-6 xl:overflow-y-auto xl:overflow-x-visible">
                      {previewImages.map((item, index) => {
                        const isActive = selectedImageIndex === index;

                        return (
                          <button
                            type="button"
                            key={`${item.src}-${index}`}
                            className={`relative flex h-36 w-24 shrink-0 items-center justify-center overflow-hidden bg-white px-2 py-2 transition-opacity duration-200 md:h-54.5 md:w-49.25 md:px-4 md:py-3 ${
                              isActive ? 'opacity-100' : 'opacity-70'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <Image
                              src={item.src}
                              alt={item.alt}
                              width={197}
                              height={218}
                              className="h-full w-full object-contain"
                            />

                            {isActive ? (
                              <span className="absolute right-0 bottom-0 left-0 h-px bg-black" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
