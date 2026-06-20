'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

/** Hero: Urban Pulse */
export default function HeroSection() {
  const { hero } = useLandingData();

  return (
    <section
      className="relative -mx-[calc(50vw-50%)] mb-[100px] h-[clamp(520px,59.03vw,850px)] w-screen overflow-hidden bg-cover bg-center bg-no-repeat after:pointer-events-none after:absolute after:inset-0 after:bg-black/20 max-md:bg-[center_22%] md:bg-[center_18%]"
      style={{ backgroundImage: `url(${hero.image.src})` }}
      aria-label={hero.image.alt}
    >
      <div className="layout-gutter relative z-1 mx-0 mr-auto box-border flex h-full w-full max-w-[527px] flex-col justify-center pt-[calc(--site-header-height+24px)] pb-16">
        <h1 className="m-0 mb-6 font-(family-name:--font-unbounded) text-4xl leading-tight font-bold text-white max-md:text-[36px]">
          {hero.title}
        </h1>
        <p className="m-0 mb-8 text-base leading-relaxed text-white">{hero.description}</p>
        <Link href={hero.cta.href} className="btn-primary">
          {hero.cta.label}
        </Link>
      </div>
    </section>
  );
}
