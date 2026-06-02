import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Product {
  id: string;
  title: string;
  price: number;
  image?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => 'products',
    }),
    getUser: builder.query<User, string>({
      query: (id) => `users/${id}`,
    }),
  }),
});

export const { useGetProductsQuery, useGetUserQuery } = api;
