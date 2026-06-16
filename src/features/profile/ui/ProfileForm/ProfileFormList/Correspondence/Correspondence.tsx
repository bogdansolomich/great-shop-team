'use client';

import { useTranslation } from '@/i18n/useTranslation';

const Correspondence = () => {
  const { t } = useTranslation();
  return <div>{t.profile.correspondence}</div>;
};

export default Correspondence;
