import { api } from '../api';
import { unwrapList } from '../api/unwrapList';
import type {
  AdminOrder,
  ApiProduct,
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  ProductImageRecord,
  ProductWriteInput,
  Subcategory,
  SubcategoryCreateInput,
  SubcategoryUpdateInput,
} from '../types';

type LocalizedText = {
  uk?: string | null;
  en?: string | null;
};

type AdminTaxonomyResponse = {
  id: number;
  slug: string;
  name: LocalizedText | string;
  status?: string;
  is_active?: boolean;
  is_hidden?: boolean;
  created_at: string;
  updated_at: string;
  category?: number;
};

type AdminProductResponse = {
  id: number;
  slug: string;
  product_code?: string | null;
  name: LocalizedText;
  description: LocalizedText;
  brand: number;
  subcategory: number;
  status: string;
  is_hidden?: boolean;
};

function localizedText(value: LocalizedText | string | null | undefined): LocalizedText {
  if (typeof value === 'string') return { uk: value, en: value };
  return value ?? {};
}

function mapTaxonomy<T extends Category | Subcategory>(item: AdminTaxonomyResponse): T {
  const names = localizedText(item.name);
  return {
    ...item,
    name: names.uk || names.en || '',
    name_uk: names.uk ?? '',
    name_en: names.en ?? '',
    is_active: item.status ? item.status === 'ACTIVE' : item.is_active !== false,
    is_hidden: item.is_hidden ?? false,
  } as T;
}

function taxonomyWriteBody(
  body: CategoryCreateInput | CategoryUpdateInput | SubcategoryCreateInput | SubcategoryUpdateInput,
) {
  const name: LocalizedText = {};
  if (body.name_uk !== undefined) name.uk = body.name_uk;
  else if (body.name !== undefined) name.uk = body.name;
  if (body.name_en !== undefined) name.en = body.name_en;
  else if (body.name !== undefined) name.en = body.name;

  const result: Record<string, unknown> = {};
  if (Object.keys(name).length) result.name = name;
  if (body.slug !== undefined) result.slug = body.slug;
  if (body.is_active !== undefined || body.is_hidden !== undefined) {
    result.status = body.is_active === false || body.is_hidden === true ? 'DRAFT' : 'ACTIVE';
  }
  if ('category' in body && body.category !== undefined) result.category = body.category;
  return result;
}

function mapAdminProduct(item: AdminProductResponse): ApiProduct {
  const name = localizedText(item.name);
  const description = localizedText(item.description);
  return {
    id: item.id,
    name: name.uk || name.en || '',
    name_uk: name.uk ?? '',
    name_en: name.en ?? '',
    description: description.uk || description.en || '',
    description_uk: description.uk ?? '',
    description_en: description.en ?? '',
    slug: item.slug,
    product_code: item.product_code ?? null,
    brand: item.brand,
    subcategory: item.subcategory,
    is_active: item.status === 'ACTIVE',
    is_hidden: item.is_hidden ?? false,
  };
}

function productWriteBody(body: ProductWriteInput | Partial<ProductWriteInput>) {
  const result: Record<string, unknown> = {};
  const name: LocalizedText = {};
  const description: LocalizedText = {};
  if (body.name_uk !== undefined) name.uk = body.name_uk;
  else if (body.name !== undefined) name.uk = body.name;
  if (body.name_en !== undefined) name.en = body.name_en;
  else if (body.name !== undefined) name.en = body.name;
  if (body.description_uk !== undefined) description.uk = body.description_uk;
  else if (body.description !== undefined) description.uk = body.description;
  if (body.description_en !== undefined) description.en = body.description_en;
  else if (body.description !== undefined) description.en = body.description;
  if (Object.keys(name).length) result.name = name;
  if (Object.keys(description).length) result.description = description;
  if (body.slug !== undefined) result.slug = body.slug;
  if (body.brand !== undefined) result.brand = body.brand;
  if (body.subcategory !== undefined) result.subcategory = body.subcategory;
  if (body.is_active !== undefined || body.is_hidden !== undefined) {
    result.status = body.is_active === false || body.is_hidden === true ? 'DRAFT' : 'ACTIVE';
  }
  return result;
}

export const adminEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminCategories: builder.query<Category[], void>({
      query: () => '/api/admin/categories/',
      transformResponse: (response: unknown) =>
        unwrapList<AdminTaxonomyResponse>(response).map((item) => mapTaxonomy<Category>(item)),
      providesTags: ['Category'],
    }),
    getAdminCategoryById: builder.query<Category, number>({
      query: (id) => `/api/admin/categories/${id}/`,
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Category>(response),
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),
    createAdminCategory: builder.mutation<Category, CategoryCreateInput>({
      query: (body) => ({
        url: '/api/admin/categories/',
        method: 'POST',
        body: taxonomyWriteBody(body),
      }),
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Category>(response),
      invalidatesTags: ['Category'],
    }),
    patchAdminCategory: builder.mutation<Category, { id: number; body: CategoryUpdateInput }>({
      query: ({ id, body }) => ({
        url: `/api/admin/categories/${id}/`,
        method: 'PATCH',
        body: taxonomyWriteBody(body),
      }),
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Category>(response),
      invalidatesTags: ['Category'],
    }),
    getAdminSubcategories: builder.query<Subcategory[], void>({
      query: () => '/api/admin/subcategories/',
      transformResponse: (response: unknown) =>
        unwrapList<AdminTaxonomyResponse>(response).map((item) => mapTaxonomy<Subcategory>(item)),
      providesTags: ['Subcategory'],
    }),
    getAdminSubcategoryById: builder.query<Subcategory, number>({
      query: (id) => `/api/admin/subcategories/${id}/`,
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Subcategory>(response),
      providesTags: (_result, _error, id) => [{ type: 'Subcategory', id }],
    }),
    createAdminSubcategory: builder.mutation<Subcategory, SubcategoryCreateInput>({
      query: (body) => ({
        url: '/api/admin/subcategories/',
        method: 'POST',
        body: taxonomyWriteBody(body),
      }),
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Subcategory>(response),
      invalidatesTags: ['Subcategory'],
    }),
    patchAdminSubcategory: builder.mutation<
      Subcategory,
      { id: number; body: SubcategoryUpdateInput }
    >({
      query: ({ id, body }) => ({
        url: `/api/admin/subcategories/${id}/`,
        method: 'PATCH',
        body: taxonomyWriteBody(body),
      }),
      transformResponse: (response: AdminTaxonomyResponse) => mapTaxonomy<Subcategory>(response),
      invalidatesTags: ['Subcategory'],
    }),
    getAdminProducts: builder.query<ApiProduct[], void>({
      query: () => '/api/admin/products/',
      transformResponse: (response: unknown) =>
        unwrapList<AdminProductResponse>(response).map(mapAdminProduct),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id: `admin-${id}` })),
              { type: 'Product', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Product', id: 'ADMIN_LIST' }],
    }),
    getAdminProductById: builder.query<ApiProduct, number>({
      query: (id) => `/api/admin/products/${id}/`,
      transformResponse: (response: AdminProductResponse) => mapAdminProduct(response),
      providesTags: (_result, _error, id) => [{ type: 'Product', id: `admin-${id}` }],
    }),
    createAdminProduct: builder.mutation<ApiProduct, ProductWriteInput>({
      query: (body) => ({
        url: '/api/admin/products/',
        method: 'POST',
        body: productWriteBody(body),
      }),
      transformResponse: (response: AdminProductResponse) => mapAdminProduct(response),
      invalidatesTags: [{ type: 'Product', id: 'ADMIN_LIST' }, 'Product'],
    }),
    patchAdminProduct: builder.mutation<
      ApiProduct,
      { id: number; body: Partial<ProductWriteInput> }
    >({
      query: ({ id, body }) => ({
        url: `/api/admin/products/${id}/`,
        method: 'PATCH',
        body: productWriteBody(body),
      }),
      transformResponse: (response: AdminProductResponse) => mapAdminProduct(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Product', id: `admin-${id}` },
        { type: 'Product', id: 'ADMIN_LIST' },
        'Product',
      ],
    }),
    deleteAdminProduct: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/products/${id}/`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id: `admin-${id}` },
        { type: 'Product', id: 'ADMIN_LIST' },
        'Product',
      ],
    }),
    createAdminProductImage: builder.mutation<
      ProductImageRecord,
      { product_variant: number; image: File; is_main?: boolean; sort_order?: number }
    >({
      query: ({ product_variant, image, is_main = false, sort_order = 0 }) => {
        const body = new FormData();
        body.append('product_variant', String(product_variant));
        body.append('image', image);
        body.append('is_main', String(is_main));
        body.append('sort_order', String(sort_order));
        return { url: '/api/admin/product-images/', method: 'POST', body };
      },
      invalidatesTags: ['Product'],
    }),
    deleteAdminProductImage: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/product-images/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    patchAdminProductImage: builder.mutation<
      ProductImageRecord,
      { id: number; product_variant: number; is_main?: boolean; sort_order?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/admin/product-images/${id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    getAdminOrders: builder.query<AdminOrder[], void>({
      query: () => '/api/admin/orders/',
      transformResponse: (response: unknown) => unwrapList<AdminOrder>(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Order', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Order', id: 'ADMIN_LIST' }],
    }),
    getAdminOrderById: builder.query<AdminOrder, number>({
      query: (id) => `/api/admin/orders/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    patchAdminOrderStatus: builder.mutation<AdminOrder, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/admin/orders/${id}/status/`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'ADMIN_LIST' },
      ],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
});

export const {
  useGetAdminCategoriesQuery,
  useGetAdminCategoryByIdQuery,
  useCreateAdminCategoryMutation,
  usePatchAdminCategoryMutation,
  useGetAdminSubcategoriesQuery,
  useGetAdminSubcategoryByIdQuery,
  useCreateAdminSubcategoryMutation,
  usePatchAdminSubcategoryMutation,
  useGetAdminProductsQuery,
  useGetAdminProductByIdQuery,
  useCreateAdminProductMutation,
  usePatchAdminProductMutation,
  useDeleteAdminProductMutation,
  useCreateAdminProductImageMutation,
  useDeleteAdminProductImageMutation,
  usePatchAdminProductImageMutation,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  usePatchAdminOrderStatusMutation,
} = adminEndpoints;
