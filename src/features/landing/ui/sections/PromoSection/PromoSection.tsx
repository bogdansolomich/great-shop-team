'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import { landingSection } from '../landingSectionClasses';

/** Блок 3: Sweet Obsession — промо парфюма */
export default function PromoSection() {
  const { promo } = useLandingData();

  return (
    <div className={landingSection.breakout}>
      <section
        className="layout-gutter relative mb-[100px] flex aspect-1440/850 w-full items-center overflow-hidden bg-cover bg-center bg-no-repeat text-white"
        style={{ backgroundImage: `url(${promo.image.src})` }}
        aria-label={promo.image.alt}
      >
        <div className="relative z-1 w-full max-w-[413px]">
          <h2 className="m-0 mb-5 font-(family-name:--font-unbounded) text-4xl leading-tight font-bold text-white">
            {promo.title}
          </h2>
          <p className="m-0 mb-7 font-(family-name:--font-poppins) text-base font-light leading-normal text-white/80">
            {promo.description}
          </p>
          <Link href={promo.cta.href} className="btn-outline btn-outline--light">
            {promo.cta.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
