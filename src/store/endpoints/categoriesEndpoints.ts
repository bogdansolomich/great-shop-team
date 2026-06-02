import { api } from '../api';
import { Category, CategoryCreateInput, CategoryUpdateInput } from '../types';

const categoriesEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    // Получение всех категорий
    getCategories: builder.query<Category[], void>({
      query: () => '/api/categories/',
    }),
    // Получение категории по ID
    getCategoryById: builder.query<Category, number>({
      query: (id) => `/api/categories/${id}/`,
    }),
    // Создание категории
    createCategory: builder.mutation<Category, CategoryCreateInput>({
      query: (body) => ({ url: '/api/categories/', method: 'POST', body }),
    }),
    // Обновление категории
    updateCategory: builder.mutation<Category, { id: number; body: CategoryUpdateInput }>({
      query: ({ id, body }) => ({
        url: `/api/categories/${id}/`,
        method: 'PATCH',
        body,
      }),
    }),
    // Удаление категории по ID
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/categories/${id}/`, method: 'DELETE' }),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesEndpoints;
