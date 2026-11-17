import { api } from '../api';
import { unwrapList } from '../api/unwrapList';
import type { Discount } from '../types';

export type DiscountWriteInput = Omit<Discount, 'id'>;

export const discountsEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    getDiscounts: builder.query<Discount[], void>({
      query: () => '/api/discounts/',
      transformResponse: (response: unknown) => unwrapList<Discount>(response),
      providesTags: ['Discount'],
    }),
    getDiscountById: builder.query<Discount, number>({
      query: (id) => `/api/discounts/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Discount', id }],
    }),
    createDiscount: builder.mutation<Discount, DiscountWriteInput>({
      query: (body) => ({ url: '/api/discounts/', method: 'POST', body }),
      invalidatesTags: ['Discount'],
    }),
    patchDiscount: builder.mutation<Discount, { id: number; body: Partial<DiscountWriteInput> }>({
      query: ({ id, body }) => ({ url: `/api/discounts/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['Discount'],
    }),
    deleteDiscount: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/discounts/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Discount'],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
});

export const {
  useGetDiscountsQuery,
  useGetDiscountByIdQuery,
  useCreateDiscountMutation,
  usePatchDiscountMutation,
  useDeleteDiscountMutation,
} = discountsEndpoints;
