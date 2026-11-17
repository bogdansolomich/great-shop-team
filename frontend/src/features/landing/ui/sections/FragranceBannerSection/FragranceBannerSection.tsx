'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTranslation } from '@/i18n/useTranslation';
import { landingSection } from '../landingSectionClasses';

export default function FragranceBannerSection() {
  const { t } = useTranslation();
  const banner = t.landing.fragranceBanner;
  const shoes = t.landing.shoesBanner;

  return (
    <section className={landingSection.section}>
      <div className={`${landingSection.sectionContent} grid grid-cols-1 bg-white md:grid-cols-2`}>
        <div className="relative min-h-[280px] md:order-2 md:min-h-[460px]">
          <Image
            src="/images/Landing/banner.jpg"
            alt={banner.imageAlt}
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover object-center"
          />
        </div>

        <div className="flex flex-col items-start justify-center px-6 py-10 md:order-1 md:px-12 lg:px-16">
          <h2 className="m-0 max-w-[12ch] font-(family-name:--font-unbounded) text-[clamp(2rem,3.5vw,3.25rem)] leading-[0.95] font-medium text-dark">
            {banner.title}
          </h2>
          <p className="m-0 mt-5 max-w-[28rem] font-(family-name:--font-pt-sans-caption) text-base leading-relaxed text-dark/75">
            {banner.description}
          </p>
          <Link
            href="/catalog/fragrances"
            className="mt-8 inline-flex h-11 w-fit items-center justify-center rounded-[8px] border border-black px-6 font-(family-name:--font-unbounded) text-sm font-medium text-dark no-underline transition-colors hover:bg-black hover:text-white"
          >
            {banner.cta}
          </Link>
        </div>

        <div className="relative min-h-[280px] md:order-3 md:min-h-[460px]">
          <Image
            src="/images/Landing/banner2.jpg"
            alt={shoes.imageAlt}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover object-center"
          />
        </div>

        <div className="flex flex-col items-start justify-center px-6 py-10 md:order-4 md:px-12 lg:px-16">
          <h2 className="m-0 max-w-[12ch] font-(family-name:--font-unbounded) text-[clamp(2rem,3.5vw,3.25rem)] leading-[0.95] font-medium text-dark">
            {shoes.title}
          </h2>
          <p className="m-0 mt-5 max-w-[28rem] font-(family-name:--font-pt-sans-caption) text-base leading-relaxed text-dark/75">
            {shoes.description}
          </p>
          <Link
            href="/catalog/shoes"
            className="mt-8 inline-flex h-11 w-fit items-center justify-center rounded-[8px] border border-black px-6 font-(family-name:--font-unbounded) text-sm font-medium text-dark no-underline transition-colors hover:bg-black hover:text-white"
          >
            {shoes.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
