import { api } from '../api';
import { unwrapList } from '../api/unwrapList';
import type { ApiOrder } from '../types';

export const ordersEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiOrder[], void>({
      query: () => '/api/orders/',
      transformResponse: (response: unknown) => unwrapList<ApiOrder>(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== 'production',
});

export const { useGetOrdersQuery } = ordersEndpoints;
