import productCardMock from '../../data/productCard.json';
import { api } from '../api';
import type { ProductCardData, ProductImage } from '../types';

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord =>
  value && typeof value === 'object' ? (value as RawRecord) : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : fallback;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const normalizeDescription = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
};

const toImageUrl = (value: string, preferLocal = false): string => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (preferLocal && value.startsWith('/')) return value;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

  if (value.startsWith('/')) {
    return `${baseUrl}${value}`;
  }

  return `${baseUrl}/${value}`;
};

const toProductImage = (
  value: unknown,
  fallbackAlt: string,
  options?: { preferLocal?: boolean },
): ProductImage => {
  if (typeof value === 'string') {
    return { src: toImageUrl(value, options?.preferLocal), alt: fallbackAlt };
  }

  const image = asRecord(value);
  const src = asString(image.src) || asString(image.url) || asString(image.image);
  const alt = asString(image.alt, fallbackAlt);

  return {
    src: toImageUrl(src, options?.preferLocal),
    alt,
  };
};

const formatRelatedPrice = (value: unknown, currency = 'USD'): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return `${value} ${currency}`;
  }

  const price = asRecord(value);
  const current = price.current ?? price.amount ?? price.value;

  if (typeof current === 'number') {
    return `${current} ${asString(price.currency, currency)}`;
  }

  return '';
};

const normalizeRelatedProducts = (
  value: unknown,
  options?: { preferLocal?: boolean },
): ProductCardData['botonImages'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const product = asRecord(item);
    const title = asString(product.title) || asString(product.name);

    return {
      image: toProductImage(
        product.image ?? product.preview_image ?? product.photo,
        title || 'Product',
        {
          preferLocal: options?.preferLocal,
        },
      ),
      title,
      price: formatRelatedPrice(product.price),
    };
  });
};

const normalizeProduct = (
  value: unknown,
  id: number,
  options?: { preferLocalImages?: boolean },
): ProductCardData => {
  const product = asRecord(value);
  const brandData = asRecord(product.brand);
  const priceData = asRecord(product.price);
  const imagesData = asRecord(product.images);
  const mainImages = asRecord(imagesData.main);

  const title = asString(product.title) || asString(product.name, 'Product');
  const brand = asString(product.brand) || asString(brandData.name);
  const currency = asString(priceData.currency, 'USD');
  const mainFront =
    mainImages.front ?? product.front_image ?? product.main_image ?? product.image ?? product.photo;
  const mainBack = mainImages.back ?? product.back_image ?? product.secondary_image ?? mainFront;

  return {
    id: asNumber(product.id, id),
    brand,
    title,
    description: normalizeDescription(product.description),
    price: {
      current: asNumber(
        priceData.current,
        asNumber(product.current_price, asNumber(product.price_value, 0)),
      ),
      currency,
    },
    code: asString(product.code) || asString(product.sku) || asString(product.article),
    rating: asNumber(product.rating, 0),
    size: toStringArray(product.size).length
      ? toStringArray(product.size)
      : toStringArray(product.sizes),
    images: {
      main: {
        front: toProductImage(mainFront, `${title} front`, {
          preferLocal: options?.preferLocalImages,
        }),
        back: toProductImage(mainBack, `${title} back`, {
          preferLocal: options?.preferLocalImages,
        }),
      },
      gallery: Array.isArray(imagesData.gallery)
        ? imagesData.gallery.map((item) =>
            toProductImage(item, title, { preferLocal: options?.preferLocalImages }),
          )
        : [],
      colors: Array.isArray(imagesData.colors)
        ? imagesData.colors.map((item) =>
            toProductImage(item, `${title} color`, { preferLocal: options?.preferLocalImages }),
          )
        : [],
    },
    link: {
      href: asString(asRecord(product.link).href, `/product-card?id=${id}`),
      label: asString(asRecord(product.link).label, 'Shop now'),
    },
    botonImages: normalizeRelatedProducts(
      product.botonImages ??
        product.bottomImages ??
        product.relatedProducts ??
        product.related_products,
      { preferLocal: options?.preferLocalImages },
    ),
  };
};

const useMockProductCard = process.env.NEXT_PUBLIC_USE_MOCK_PRODUCT_CARD === 'true';

export const productsEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductCardData[], void>({
      query: () => '/api/products/',
      transformResponse: (response: unknown) => {
        if (!Array.isArray(response)) {
          return [];
        }

        return response.map((item, index) => normalizeProduct(item, index + 1));
      },
      providesTags: ['Product'],
    }),
    getProductCard: builder.query<ProductCardData, void>({
      queryFn: async (_arg, _api, _extraOptions, fetchWithBQ) => {
        if (useMockProductCard) {
          return {
            data: normalizeProduct(productCardMock, 1, { preferLocalImages: true }),
          };
        }

        const result = await fetchWithBQ('/api/products/product-card/');

        if (result.error) {
          return {
            error: result.error,
          };
        }

        return {
          data: normalizeProduct(result.data, 1),
        };
      },
      providesTags: [{ type: 'Product', id: 'product-card' }],
    }),
    getProductById: builder.query<ProductCardData, number>({
      query: (id) => `/api/products/${id}/`,
      transformResponse: (response: unknown, _meta, id) => normalizeProduct(response, id),
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductCardQuery, useGetProductByIdQuery } =
  productsEndpoints;
