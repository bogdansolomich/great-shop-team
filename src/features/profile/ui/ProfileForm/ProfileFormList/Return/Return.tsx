'use client';

import { useTranslation } from '@/i18n/useTranslation';

const Return = () => {
  const { t } = useTranslation();
  return <div>{t.profile.return}</div>;
};

export default Return;
