'use client';
import {
  useGetProfileByIdQuery,
  usePatchProfileMutation,
} from '@/store/endpoints/profilesEndpoints';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useState } from 'react';

interface ProfileForm {
  first_name: string;
  last_name: string;
  // surname: string;
  // gender: number;
  // clothing_size: number;
  // shoe_size: number;
  birthday: string;
  phone: string;
  // email: string;
}

const PersonalData = () => {
  const { user } = useAuth();

  const userId = user?.id;
  const { data: profile, isLoading, isError } = useGetProfileByIdQuery(userId ?? skipToken);

  const [patchProfile, { isLoading: isUpdating }] = usePatchProfileMutation();


  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    // surname: '',
    // gender: 1,
    // clothing_size: 1,
    // shoe_size: 1,
    birthday: '',
    phone: '',
    // email: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        // surname: profile.surname ?? '',
        // gender: profile.gender ?? 1,
        // clothing_size: profile.clothing_size ?? 1,
        // shoe_size: profile.shoe_size ?? 1,
        birthday: profile.birthday ?? '',
        phone: profile.phone ?? '',
        // email: profile.user.email ?? '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault();

    try {
      if (!userId){
        return;
      }
      await patchProfile({
        profile_id: userId,
        body: form,
      }).unwrap();
      console.log('profile updated');
    } catch (error) {
      console.error(error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (!profile) return null;


  return (
    <>
      <form onSubmit={handleSubmit}>
        <p className="text-[20px] font-normal my-4">Personal Data</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="firstName">First name</label>
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
            <label htmlFor="lastName">Last name</label>
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
            <label htmlFor="phoneNumber">Phone Number</label>
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
            <label htmlFor="birthday">Birthday</label>
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
            <label htmlFor="phoneNumber">Gender</label>
            {/*изменить когда на select бекенде будет string*/}
            {/*<select>*/}
            {/*  <option value="male">Male</option>*/}
            {/*  <option value="female">Female</option>*/}
            {/*</select>*/}
            <input
              id="gender"
              name={'gender'}
              type="text"
              // value={form.gender}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="birthday">City</label>
            <input
              id="city"
              name={'city'}
              type="text"
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <p className="text-[20px] font-normal my-4 py-[15px]">Sizes</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="clothing_size">Clothing</label>
            {/*изменить когда на select бекенде будет string*/}
            {/*<select>*/}
            {/*  <option>S</option>*/}
            {/*  <option>M</option>*/}
            {/*  <option>L</option>*/}
            {/*  <option>XL</option>*/}
            {/*</select>*/}
            <input
              id="clothing"
              type="text"
              name={'clothing_size'}
              // value={form.clothing_size}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="shoe_size">Shoe size (EU)</label>
            <input
              id="shoe_size"
              name={'shoe_size'}
              type="text"
              // value={form.shoe_size}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>
        </div>

        <p className="text-[20px] font-normal my-4">Account Details</p>

        <div className="flex">
          <div className="flex flex-col mr-2">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name={'email'}
              // value={form.email}
              onChange={handleChange}
              className="w-[413px] border border-[#222] rounded-lg p-2 my-2"
            />
          </div>

          <div className="flex flex-col mr-2">
            <label htmlFor="password">Password</label>
            <input className="w-[413px] border border-[#222] rounded-lg p-2 my-2" />
          </div>
        </div>
        <div className="flex justify-center items-center my-10">
          <button
            className="border border-[#222] bg-[#222]  text-white p-4 rounded-lg"
            type={'submit'}
          >
            Save changes
          </button>
        </div>
        <div className="flex flex-row flex-1 border border-[#CF000059] p-3 rounded-lg my-15 justify-between">
          <div className="">
            <p className="text-[16px] text-[#C0392B] ">Delete account</p>
            <p className="text-[14px] text-[#9A9A97] max-w-[72%]">
              Permanent action — all your data will be removed and cannot be recovered.
            </p>
          </div>
          <button
            className="border border-[#DA000066] px-5 py-3 text-[#C0392B] text-[14px] rounded-lg self-center"
            type="button"
          >
            Delete account
          </button>
        </div>
      </form>
    </>
  );
};

export default PersonalData;
