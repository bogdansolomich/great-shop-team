'use client';

import { useTranslation } from '@/i18n/useTranslation';

const Support = () => {
  const { t } = useTranslation();
  return <div>{t.profile.support}</div>;
};

export default Support;
