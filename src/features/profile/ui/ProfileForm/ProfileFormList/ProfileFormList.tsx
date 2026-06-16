'use client';

import { ReactNode, useMemo, useState } from 'react';

import MyReviews from '@/features/profile/ui/ProfileForm/ProfileFormList/MyReviews/MyReviews';
import Settings from '@/features/profile/ui/ProfileForm/ProfileFormList/Settings/Settings';
import PersonalData from '@/features/profile/ui/ProfileForm/ProfileFormList/PersonalData/PersonalData';
import Correspondence from '@/features/profile/ui/ProfileForm/ProfileFormList/Correspondence/Correspondence';
import Support from '@/features/profile/ui/ProfileForm/ProfileFormList/Support/Support';
import DeleteAccount from '@/features/profile/ui/ProfileForm/ProfileFormList/DeleteAccount/DeleteAccount';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '../ProfileFormList/ProfileFormList.module.scss';

type Tab = 'reviews' | 'settings' | 'personalData' | 'correspondence' | 'support' | 'deleteAccount';

const ProfileFormList = () => {
  const { t } = useTranslation();

  const tabs = useMemo(
    () => [
      { id: 'reviews' as Tab, label: t.profile.myReviews },
      { id: 'settings' as Tab, label: t.profile.settings },
      { id: 'correspondence' as Tab, label: t.profile.correspondence },
      { id: 'deleteAccount' as Tab, label: t.profile.deleteAccount },
      { id: 'personalData' as Tab, label: t.profile.personalData },
    ],
    [t],
  );

  const tabContent: Record<Tab, ReactNode> = {
    reviews: <MyReviews />,
    settings: <Settings />,
    personalData: <PersonalData />,
    correspondence: <Correspondence />,
    support: <Support />,
    deleteAccount: <DeleteAccount />,
  };

  const [activeTab, setActiveTab] = useState<Tab>('personalData');

  return (
    <>
      <div className={styles.wraper}>
        <div className={styles.hederTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.tabChoice : styles.tabs}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.content}>{tabContent[activeTab]}</div>
      </div>
    </>
  );
};

export default ProfileFormList;
