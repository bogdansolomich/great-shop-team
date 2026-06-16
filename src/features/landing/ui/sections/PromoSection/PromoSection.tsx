'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import sectionStyles from '../LandingSection.module.scss';
import styles from './PromoSection.module.scss';

/** Блок 3: Sweet Obsession — промо парфюма */
export default function PromoSection() {
  const { promo } = useLandingData();

  return (
    <div className={sectionStyles.breakout}>
      <section
        className={styles.promo}
        style={{ backgroundImage: `url(${promo.image.src})` }}
        aria-label={promo.image.alt}
      >
        <div className={styles.content}>
          <h2 className={styles.title}>{promo.title}</h2>
          <p className={styles.description}>{promo.description}</p>
          <Link href={promo.cta.href} className="btn-outline btn-outline--light">
            {promo.cta.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
