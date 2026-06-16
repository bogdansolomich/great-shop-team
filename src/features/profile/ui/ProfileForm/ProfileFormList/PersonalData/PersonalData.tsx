'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import {
  useGetProfileByIdQuery,
  usePatchProfileMutation,
} from '@/store/endpoints/profilesEndpoints';

interface ProfileForm {
  first_name: string;
  last_name: string;
  birthday: string;
  phone: string;
}

const PersonalData = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const userId = user?.id;
  const { data: profile, isLoading, isError } = useGetProfileByIdQuery(userId ?? skipToken);

  const [patchProfile, { isLoading: isUpdating }] = usePatchProfileMutation();

  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    birthday: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        birthday: profile.birthday ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!userId) {
        return;
      }
      await patchProfile({
        profile_id: userId,
        body: form,
      }).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) return <div>{t.common.loading}</div>;
  if (isError) return <div>{t.common.error}</div>;
  if (!profile) return null;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <p className="text-[20px] font-normal my-4">{t.profile.personalDataTitle}</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="firstName">{t.profile.firstName}</label>
            <input
              id="firstName"
              name="first_name"
              type="text"
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
              value={form.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="lastName">{t.profile.lastName}</label>
            <input
              id="lastName"
              name="last_name"
              type="text"
              value={form.last_name}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="phoneNumber">{t.profile.phoneNumber}</label>
            <input
              id="phoneNumber"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="birthday">{t.profile.birthday}</label>
            <input
              id="birthday"
              name="birthday"
              type="text"
              value={form.birthday}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="gender">{t.profile.gender}</label>
            <input
              id="gender"
              name="gender"
              type="text"
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="city">{t.profile.city}</label>
            <input
              id="city"
              name="city"
              type="text"
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <p className="text-[20px] font-normal my-4 py-[15px]">{t.profile.sizes}</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="clothing_size">{t.profile.clothing}</label>
            <input
              id="clothing"
              type="text"
              name="clothing_size"
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="shoe_size">{t.profile.shoeSize}</label>
            <input
              id="shoe_size"
              name="shoe_size"
              type="text"
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <p className="text-[20px] font-normal my-4">{t.profile.accountDetails}</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="email">{t.profile.email}</label>
            <input
              id="email"
              type="email"
              name="email"
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="password">{t.profile.password}</label>
            <input className="w-[413px] border border-[#222] rounded-lg p-2 my-2" />
          </div>
        </div>
        <div className="flex justify-center items-center my-10">
          <button
            className="border border-[#222] bg-[#222]  text-white p-4 rounded-lg"
            type="submit"
            disabled={isUpdating}
          >
            {isUpdating ? t.common.saving : t.profile.saveChanges}
          </button>
        </div>
        <div className="flex flex-row flex-1 border border-[#CF000059] p-3 rounded-lg my-15 justify-between">
          <div className="">
            <p className="text-[16px] text-[#C0392B] ">{t.profile.deleteAccountTitle}</p>
            <p className="text-[14px] text-[#9A9A97] max-w-[72%]">{t.profile.deleteAccountWarning}</p>
          </div>
          <button
            className="border border-[#DA000066] px-5 py-3 text-[#C0392B] text-[14px] rounded-lg self-center"
            type="button"
          >
            {t.profile.deleteAccountTitle}
          </button>
        </div>
      </form>
    </>
  );
};

export default PersonalData;
