'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSessionEmail } from '@/features/auth/hooks/useSessionEmail';
import {
  bell,
  compited,
  exit,
  location,
  orders,
  user,
} from '@/features/profile/ui/ProfileForm/icon/ProfileIcon';
import OrderFormList from '@/features/profile/ui/ProfileForm/OrderFormList/OrderFormList';
import ProfileFormList from '@/features/profile/ui/ProfileForm/ProfileFormList/ProfileFormList';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './Profile.module.scss';

type MenuId = 'profile' | 'bonuses' | 'orders' | 'addresses' | 'notifications' | 'out';

const ProfileForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useSessionEmail();
  const { logoutUser } = useAuth();

  const tabMenuContent: Record<string, ReactNode> = {
    profile: <ProfileFormList />,
    orders: <OrderFormList />,
  };

  const [activeTab, setActiveTab] = useState<MenuId>('profile');
  const [activeMenuId, setActiveMenuId] = useState<MenuId>('profile');

  const listMain = useMemo(
    () => [
      { id: 'profile' as MenuId, name: t.account.profile, icon: user },
      { id: 'bonuses' as MenuId, name: t.account.bonuses, icon: compited },
      { id: 'orders' as MenuId, name: t.account.myOrders, icon: orders },
      { id: 'addresses' as MenuId, name: t.account.addresses, icon: location },
      { id: 'notifications' as MenuId, name: t.account.notifications, icon: bell },
      { id: 'out' as MenuId, name: t.account.logOut, icon: exit },
    ],
    [t],
  );

  function handleMenuClick(id: MenuId) {
    if (id === 'out') {
      router.replace('/');
      logoutUser();
      return;
    }

    setActiveMenuId(id);
    setActiveTab(id);
  }

  const displayName = email.split('@')[0] || t.account.user;

  return (
    <div className={styles.headerProfile}>
      <div className={styles.main}>
        <div className={styles.nameUser}>
          <div>{t.account.hello}</div>
          <span className={styles.user}>{displayName}</span>
        </div>
        {listMain.map((value) => (
          <div
            key={value.id}
            className={activeMenuId === value.id ? styles.listItemMainActive : styles.listItemMain}
            onClick={() => handleMenuClick(value.id)}
          >
            {value.icon}
            {value.name}
          </div>
        ))}
      </div>
      {tabMenuContent[activeTab]}
    </div>
  );
};

export default ProfileForm;
