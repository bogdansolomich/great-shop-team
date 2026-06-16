'use client';

import { useTranslation } from '@/i18n/useTranslation';

const Settings = () => {
  const { t } = useTranslation();
  return <div>{t.profile.settings}</div>;
};

export default Settings;
