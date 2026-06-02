import { api } from '../api';
import {
  LoginInput,
  TokenRefreshResponse,
  RegisterInput,
  User,
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetConfirmInput,
  ActivationParams,
} from '../types';

const authEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    // Логін
    login: builder.mutation<TokenRefreshResponse, LoginInput>({
      query: (body) => ({ url: '/api/login/', method: 'POST', body }),
    }),
    // Реєстрація
    registerUser: builder.mutation<User, RegisterInput>({
      query: (body) => ({ url: '/api/users/register/', method: 'POST', body }),
    }),
    // Оновлення access token по refresh token
    refreshToken: builder.mutation<TokenRefreshResponse, { refresh: string }>({
      query: (body) => ({ url: '/api/token/refresh/', method: 'POST', body }),
    }),
    // Поточний користувач
    getCurrentUser: builder.query<void, void>({
      query: () => '/api/users/current-user/',
    }),
    // Активація користувача по посиланню
  
    activateUserPatch: builder.mutation<void, ActivationParams>({
      query: ({ uidb64, token }) => ({
        url: `/api/users/activate/${uidb64}/${token}/`,
        method: 'PATCH',
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
    // Підтвердження скидання пароля по посиланню
    resetPasswordConfirm: builder.mutation<
      void,
      { uidb64: string; token: string; body: PasswordResetConfirmInput }
    >({
      query: ({ uidb64, token, body }) => ({
        url: `/api/users/password-reset-confirm/${uidb64}/${token}/`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterUserMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useActivateUserPatchMutation,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useResetPasswordConfirmMutation,
} = authEndpoints;
