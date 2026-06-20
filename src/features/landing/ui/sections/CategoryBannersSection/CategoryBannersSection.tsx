'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import { landingSection } from '../landingSectionClasses';

/** Блок 2: Urban Essentials + Oversized Tailoring */
export default function CategoryBannersSection() {
  const { categories, labels } = useLandingData();

  return (
    <section className={landingSection.section}>
      <div className={landingSection.sectionContentBanners}>
        <div className="grid w-full grid-cols-2 gap-5 max-md:grid-cols-1 max-md:justify-center">
          {categories.map((item) => (
            <article
              key={item.title}
              className="relative mx-auto flex h-[850px] w-full max-w-[630px] flex-col justify-end overflow-hidden p-8 text-white"
            >
              <div
                className="absolute inset-0 after:absolute after:inset-0 after:bg-linear-to-t after:from-black/45 after:to-transparent after:to-60%"
                aria-hidden
              >
                <Image
                  src={item.image.src}
                  alt=""
                  fill
                  sizes="630px"
                  className="h-full w-full object-cover"
                />
              </div>
              {item.thumb.src && (
                <div className="absolute top-6 right-6 z-1 h-[140px] w-[118px] overflow-hidden bg-white">
                  <Image
                    src={item.thumb.src}
                    alt={item.thumb.alt}
                    width={118}
                    height={140}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="relative z-1">
                <h2 className="m-0 mb-3 font-(family-name:--font-unbounded) text-2xl font-bold tracking-wide">
                  {item.title}
                </h2>
                <Link href={item.href} className="btn-outline btn-outline--light">
                  {labels.shopNow}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
