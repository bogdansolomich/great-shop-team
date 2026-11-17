import type { Metadata } from 'next';

import { SalesDiscountDetails } from '@/features/sales/ui/SalesPage/SalesPage';
import { getDictionary } from '@/i18n/dictionaries';
import { defaultLocale } from '@/i18n/config';

type SalesDiscountPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: getDictionary(defaultLocale).salesPage.title };
}

export default async function SalesDiscountPage({ params }: SalesDiscountPageProps) {
  const { id } = await params;
  return <SalesDiscountDetails id={id} />;
}
