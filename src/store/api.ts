import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { logout, setToken } from './slices/userSlice';

let tokenRefreshPromise: Promise<string | null> | null = null;

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token =
      (getState() as any).user?.token ||
      (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === 'string' ? args : args.url;
  
  // 1. Проверяем, стоит ли очередь на паузе
  if (tokenRefreshPromise) {
    console.log(`⏳ [RTK Reauth] Запрос [${url}] встал в очередь. Ждем обновления токена...`);
    await tokenRefreshPromise;
    console.log(`✅ [RTK Reauth] Запрос [${url}] дождался обновления и продолжает выполнение.`);
  }

  let result = await baseQuery(args, api, extraOptions);

  // 2. Поймали 401 ошибку
  if (result.error && result.error.status === 401) {
    console.warn(`❌ [RTK Reauth] Запрос [${url}] упал с ошибкой 401 (Unauthorized)`);
    
    const isRefreshRequest = typeof args === 'object' && args.url === '/api/token/refresh/';

    if (!isRefreshRequest) {
      
      // 3. Если мы первые, кто поймал 401 — берем на себя обновление токена
      if (!tokenRefreshPromise) {
        console.log(`🚀 [RTK Reauth] Инициируем ОДИН общий запрос на обновление токена.`);
        
        tokenRefreshPromise = (async () => {
          try {
            const refreshToken =
              typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

            if (!refreshToken) {
              console.error('🚫 [RTK Reauth] Refresh token не найден в localStorage');
              return null;
            }

            const refreshResult = await baseQuery(
              {
                url: '/api/token/refresh/',
                method: 'POST',
                body: { refresh: refreshToken },
              },
              api,
              extraOptions,
            );

            if (refreshResult.data) {
              const data = refreshResult.data as { access?: string; refresh?: string };

              if (data.access) {
                console.log('🎉 [RTK Reauth] Токен успешно обновлен! Записываем в стейт.');
                localStorage.setItem('accessToken', data.access);
                api.dispatch(setToken(data.access));

                if (data.refresh) {
                  localStorage.setItem('refreshToken', data.refresh);
                }
                
                return data.access; 
              }
            }
            
            console.error('🔥 [RTK Reauth] Бэкенд отклонил refresh-токен. Направляем на логаут.');
            api.dispatch(logout());
            return null;
          } catch (e) {
            console.error('🔥 [RTK Reauth] Ошибка при выполнении рефреш-запроса:', e);
            api.dispatch(logout());
            return null;
          } finally {
            // Освобождаем замок
            console.log('🔓 [RTK Reauth] Сбрасываем промис ожидания. Очередь свободна.');
            tokenRefreshPromise = null;
          }
        })();
      } else {
        console.log(`👥 [RTK Reauth] Запрос [${url}] обнаружил, что токен УЖЕ обновляется. Ждем...`);
      }

      // 4. Ждем результат обновления (и первый запрос, и догнавшие его параллельные)
      const newToken = await tokenRefreshPromise;

      if (newToken) {
        console.log(`🔄 [RTK Reauth] Переотправляем исходный запрос [${url}] со свежим токеном.`);
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Profile'],
  endpoints: () => ({}),
});
