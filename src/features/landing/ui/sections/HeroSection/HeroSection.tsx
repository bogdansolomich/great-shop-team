'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import styles from './HeroSection.module.scss';

/** Hero: Urban Pulse */
export default function HeroSection() {
  const { hero } = useLandingData();

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `url(${hero.image.src})` }}
      aria-label={hero.image.alt}
    >
      <div className={styles.content}>
        <h1 className={styles.title}>{hero.title}</h1>
        <p className={styles.description}>{hero.description}</p>
        <Link href={hero.cta.href} className="btn-primary">
          {hero.cta.label}
        </Link>
      </div>
    </section>
  );
}
