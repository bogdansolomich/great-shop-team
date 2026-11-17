import type { Metadata } from 'next';

import SalesPage from '@/features/sales/ui/SalesPage/SalesPage';
import { getDictionary } from '@/i18n/dictionaries';
import { defaultLocale } from '@/i18n/config';

export function generateMetadata(): Metadata {
  return { title: getDictionary(defaultLocale).salesPage.title };
}

export default function Page() {
  return <SalesPage />;
}
