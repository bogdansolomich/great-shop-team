'use client';

import { useTranslation } from '@/i18n/useTranslation';
import { landingSection } from '../landingSectionClasses';

const benefits = [
  {
    id: 'worldwideShipping',
    icon: (
      <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M4 12h16" />
        <path strokeLinecap="round" d="M12 4c2.2 2.4 3.3 5.1 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.1-3.3-8s1.1-5.6 3.3-8z" />
      </svg>
    ),
  },
  {
    id: 'freeReturns',
    icon: (
      <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.2 7.2A6.4 6.4 0 1 0 18 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.2 4.6 16.4 8l3.2-.6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m18.2 5.2.35.9.9.15-.7.55.2.9-.75-.45-.75.45.2-.9-.7-.55.9-.15z" />
      </svg>
    ),
  },
  {
    id: 'secureCheckout',
    icon: (
      <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 19 6.4v5.1c0 4-2.7 6.9-7 8.5-4.3-1.6-7-4.5-7-8.5V6.4L12 3.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.1 1.8 1.8 4-4" />
      </svg>
    ),
  },
  {
    id: 'liveStyleAdvice',
    icon: (
      <svg viewBox="0 0 24 24" className="size-11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.2 16.4 5.2 19.2l3.2-1.2A7.2 7.2 0 1 0 7.2 16.4z" />
      </svg>
    ),
  },
] as const;

export default function BenefitsSection() {
  const { t } = useTranslation();

  return (
    <section className={landingSection.section}>
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-y-8 sm:grid-cols-4">
        {benefits.map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-4 px-3 text-dark">
            {item.icon}
            <p className="m-0 text-center font-(family-name:--font-pt-sans-caption) text-base text-dark md:text-lg">
              {t.landing.benefits[item.id]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
