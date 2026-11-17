'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineUser,
} from 'react-icons/hi2';

import { useAuth } from '@/features/auth/hooks/useAuth';
import AccountDetails from '@/features/profile/ui/ProfileForm/AccountDetails';
import AccountFavorites from '@/features/profile/ui/ProfileForm/AccountFavorites';
import AccountPassword from '@/features/profile/ui/ProfileForm/AccountPassword';
import { readAccountProfile } from '@/features/profile/ui/ProfileForm/accountProfile';
import Orders from '@/features/orders/Orders';
import { useTranslation } from '@/i18n/useTranslation';
import { useGetCurrentUserQuery } from '@/store/endpoints/authEndpoints';

type AccountTab = 'profile' | 'settings' | 'favorites' | 'orders';

function readTab(value: string | null): AccountTab {
  if (value === 'settings' || value === 'favorites' || value === 'orders') return value;
  return 'profile';
}

const ProfileForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = readTab(searchParams.get('tab'));
  const { logoutUser, token } = useAuth();
  const { data } = useGetCurrentUserQuery(undefined, { skip: !token });
  const profile = readAccountProfile(data);
  const [typedName, setTypedName] = useState<string | null>(null);
  const onNameChange = useCallback((name: string) => setTypedName(name), []);

  const displayName = useMemo(() => {
    if (typedName != null) return typedName;
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  }, [profile?.first_name, profile?.last_name, typedName]);

  const menu = useMemo(
    () => [
      { id: 'profile' as const, name: t.account.profile, icon: HiOutlineUser },
      { id: 'settings' as const, name: t.account.settings, icon: HiOutlineCog6Tooth },
      { id: 'favorites' as const, name: t.account.favorites, icon: HiOutlineHeart },
      { id: 'orders' as const, name: t.account.myOrders, icon: HiOutlineShoppingBag },
    ],
    [t],
  );

  function openTab(id: AccountTab) {
    router.push(id === 'profile' ? '/profile' : `/profile?tab=${id}`);
  }

  function logOut() {
    logoutUser();
    router.replace('/');
  }

  return (
    <div className="layout-container py-8 md:py-12">
      <p className="m-0 text-sm text-dark">{t.account.hello}</p>
      <p className="mt-1 min-h-8 text-[28px] leading-tight font-bold text-dark md:text-[32px]">
        {displayName}
      </p>
      <div className="mt-4 mb-6 h-px w-full bg-black" />
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        <aside className="w-full shrink-0 md:w-max">
          <nav className="grid w-full grid-cols-2 gap-2 md:flex md:flex-col" aria-label={t.account.account}>
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-black px-3 text-left text-sm ${
                    isActive ? 'bg-black text-white' : 'bg-white text-dark'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => openTab(item.id)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.name}
                </button>
              );
            })}
            <button
              type="button"
              className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-black bg-white px-3 text-left text-sm text-dark"
              onClick={logOut}
            >
              <HiOutlineArrowRightOnRectangle className="size-4 shrink-0" aria-hidden />
              {t.account.logOut}
            </button>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {activeTab === 'profile' ? <AccountDetails onNameChange={onNameChange} /> : null}
          {activeTab === 'settings' ? <AccountPassword /> : null}
          {activeTab === 'favorites' ? <AccountFavorites /> : null}
          {activeTab === 'orders' ? <Orders /> : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
