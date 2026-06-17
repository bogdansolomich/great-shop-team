'use client';

import { useTranslation } from '@/i18n/useTranslation';

const MyPromocodes = () => {
  const { t } = useTranslation();
  return <div>{t.profile.myPromocodes}</div>;
};

export default MyPromocodes;
