import { api } from '../api';
import {
  LoginInput,
  TokenRefreshResponse,
  RegisterInput,
  User,
  PasswordChangeInput,
  PasswordResetInput,
  ActivationCodeInput,
  ResendActivationInput,
} from '../types';

export const authEndpoints = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Логін
    login: builder.mutation<TokenRefreshResponse, LoginInput>({
      query: (body) => ({ url: '/api/login/', method: 'POST', body }),
      // Вказуємо, що після логіну треба скинути кеш юзера, щоб завантажити свіжі дані
      invalidatesTags: ['User'],
    }),

    // Реєстрація
    registerUser: builder.mutation<User, RegisterInput>({
      query: (body) => ({ url: '/api/users/register/', method: 'POST', body }),
    }),

    // Поточний користувач — 💎 ТУТ ВИПРАВЛЕНО ТИП НА <User, void>
    getCurrentUser: builder.query<User, void>({
      query: () => '/api/users/current-user/',
      providesTags: ['User'], // Тегуємо цей запит
    }),

    // Активація користувача по коду
    activateUserPatch: builder.mutation<void, ActivationCodeInput>({
      query: (body) => ({
        url: '/api/users/activate/',
        method: 'PATCH',
        body,
      }),
    }),

    // Зміна пароля
    changePassword: builder.mutation<void, PasswordChangeInput>({
      query: (body) => ({ url: '/api/users/password-change/', method: 'POST', body }),
    }),

    // Скидання пароля
    resetPassword: builder.mutation<PasswordResetInput, PasswordResetInput>({
      query: (body) => ({ url: '/api/users/password-reset/', method: 'POST', body }),
    }),

    // Повторне відправлення коду активації
    resendActivationCode: builder.mutation<void, ResendActivationInput>({
      query: (body) => ({
        url: '/api/users/resend_activation_code/',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterUserMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useActivateUserPatchMutation,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useResendActivationCodeMutation,
} = authEndpoints;
