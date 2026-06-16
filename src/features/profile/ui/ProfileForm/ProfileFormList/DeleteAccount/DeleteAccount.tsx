'use client';

import { useTranslation } from '@/i18n/useTranslation';

const DeleteAccount = () => {
  const { t } = useTranslation();
  return <div>{t.profile.deleteAccount}</div>;
};

export default DeleteAccount;
