import { api } from '../api';
import { Profile, ProfileUpdateInput } from '../types';

const profilesEndpoints = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfiles: builder.query<Profile[], void>({
      query: () => '/api/profiles/',
    }),
    getProfileById: builder.query<Profile, number>({
      query: (profile_id) => `/api/profiles/${profile_id}/`,
    }),
    updateProfile: builder.mutation<Profile, { profile_id: number; body: ProfileUpdateInput }>({
      query: ({ profile_id, body }) => ({
        url: `/api/profiles/${profile_id}/`,
        method: 'PUT',
        body,
      }),
    }),
    patchProfile: builder.mutation<Profile, { profile_id: number; body: ProfileUpdateInput }>({
      query: ({ profile_id, body }) => ({
        url: `/api/profiles/${profile_id}/`,
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

export const {
  useGetProfilesQuery,
  useGetProfileByIdQuery,
  useUpdateProfileMutation,
  usePatchProfileMutation,
} = profilesEndpoints;
