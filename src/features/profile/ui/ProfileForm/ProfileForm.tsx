'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

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

import styles from './Profile.module.scss';

const ProfileForm = () => {
  const router = useRouter();
  const { email } = useSessionEmail();
  const { logoutUser } = useAuth();

  type MenuItem = {
    id: string;
    name: string;
    active: boolean;
    icon: React.ReactNode;
  };

  const tabMenuContent: Record<string, ReactNode> = {
    profile: <ProfileFormList />,
    orders: <OrderFormList />,
  };
  const [activeTab, setActiveTab] = useState<string>('profile');

  const [listMain, setListMain] = useState<MenuItem[]>([
    { id: 'profile', name: 'Profile', active: false, icon: user },
    { id: 'bonuses', name: 'Bonuses', active: false, icon: compited },
    { id: 'orders', name: 'My orders', active: false, icon: orders },
    { id: 'addresses', name: 'Addresses', active: false, icon: location },
    { id: 'notifications', name: 'Notifications', active: false, icon: bell },
    { id: 'out', name: 'Log out', active: false, icon: exit },
  ]);

  function changeActive(id: string) {
    setListMain((item) =>
      item.map((e) => {
        if (e.id === id) {
          return { ...e, active: true };
        }
        return { ...e, active: false };
      }),
    );
  }

  function handleMenuClick(id: string) {
    if (id === 'out') {
      router.replace('/');
      logoutUser();
      return;
    }

    changeActive(id);
    setActiveTab(id);
  }

  const displayName = email.split('@')[0] || 'User';

  return (
    <div className={styles.headerProfile}>
      <div className={styles.main}>
        <div className={styles.nameUser}>
          <div>Hello</div>
          <span className={styles.user}>{displayName}</span>
        </div>
        {listMain.map((value) => (
          <div
            key={value.id}
            className={value.active ? styles.listItemMainActive : styles.listItemMain}
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
