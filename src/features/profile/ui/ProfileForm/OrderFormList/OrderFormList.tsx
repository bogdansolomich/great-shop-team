'use client';

import { useTranslation } from '@/i18n/useTranslation';

const OrderFormList = () => {
  const { t } = useTranslation();
  return <div>{t.profile.orderFormList}</div>;
};

export default OrderFormList;
