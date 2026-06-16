'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import FragranceProductCard from './FragranceProductCard';
import sectionStyles from '../LandingSection.module.scss';

/** Блок 4: Recently released — парфюм */
export default function FragrancesSection() {
  const { fragrances, labels } = useLandingData();

  return (
    <section className={sectionStyles.section}>
      <div className={sectionStyles.sectionContent}>
        <div className={sectionStyles.sectionHeader}>
          <h2 className={sectionStyles.sectionTitle}>{labels.recentlyReleased}</h2>
          <Link href="/catalog" className="btn-outline btn-outline--dark">
            {labels.shopNow}
          </Link>
        </div>
        <div className={sectionStyles.productGrid}>
          {fragrances.map((product) => (
            <FragranceProductCard key={product.title} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
