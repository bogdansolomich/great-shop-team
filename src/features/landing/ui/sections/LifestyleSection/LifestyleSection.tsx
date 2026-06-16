'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import sectionStyles from '../LandingSection.module.scss';
import styles from './LifestyleSection.module.scss';

/** Блок 5: Elevating the essentials — lifestyle-баннер */
export default function LifestyleSection() {
  const { lifestyle } = useLandingData();

  return (
    <div className={sectionStyles.breakout}>
      <section className={styles.section} aria-label={lifestyle.image.alt}>
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${lifestyle.image.src})` }}
        >
          <div className={styles.content}>
            <h2 className={styles.title}>{lifestyle.title}</h2>
            <p className={styles.description}>{lifestyle.description}</p>
          </div>
        </div>
        <div className={styles.ctaRow}>
          <Link href={lifestyle.cta.href} className={styles.cta}>
            <span className={styles.ctaLabel}>{lifestyle.cta.label}</span>
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
