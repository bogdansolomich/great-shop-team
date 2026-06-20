'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import { landingSection } from '../landingSectionClasses';

/** Блок 5: Elevating the essentials — lifestyle-баннер */
export default function LifestyleSection() {
  const { lifestyle } = useLandingData();

  return (
    <div className={landingSection.breakout}>
      <section className="w-full" aria-label={lifestyle.image.alt}>
        <div
          className="layout-gutter relative flex aspect-1440/850 w-full items-center overflow-hidden bg-cover bg-center bg-no-repeat text-white"
          style={{ backgroundImage: `url(${lifestyle.image.src})` }}
        >
          <div className="relative z-1 w-full max-w-[413px]">
            <h2 className="m-0 mb-5 font-(family-name:--font-unbounded) text-4xl leading-tight font-bold text-white uppercase">
              {lifestyle.title}
            </h2>
            <p className="m-0 font-(family-name:--font-poppins) text-base font-light leading-normal text-white/80">
              {lifestyle.description}
            </p>
          </div>
        </div>
        <div className="flex justify-end bg-white px-4 py-4 min-[481px]:px-6 md:px-6 lg:px-20">
          <Link
            href={lifestyle.cta.href}
            className="inline-flex items-center gap-2 font-(family-name:--font-poppins) text-base font-light text-black no-underline"
          >
            <span className="underline underline-offset-8">{lifestyle.cta.label}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
