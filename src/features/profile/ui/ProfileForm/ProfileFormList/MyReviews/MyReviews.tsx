'use client';

import { useTranslation } from '@/i18n/useTranslation';

const MyReviews = () => {
  const { t } = useTranslation();
  return <div>{t.profile.myReviews}</div>;
};

export default MyReviews;
