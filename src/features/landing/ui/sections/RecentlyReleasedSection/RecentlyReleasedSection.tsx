'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import ClothingProductCard from './ClothingProductCard';
import sectionStyles from '../LandingSection.module.scss';

/** Блок 1: Recently released — одежда */
export default function RecentlyReleasedSection() {
  const { clothing, labels } = useLandingData();

  return (
    <section className={sectionStyles.section}>
      <div className={sectionStyles.sectionContent}>
        <h2 className={sectionStyles.sectionTitle}>{labels.recentlyReleased}</h2>
        <div className={sectionStyles.productGrid}>
          {clothing.map((product) => (
            <ClothingProductCard key={product.title} {...product} />
          ))}
        </div>
        <div className={sectionStyles.sectionCta}>
          <Link href="/catalog" className="btn-primary">
            {labels.viewAllProducts}
          </Link>
        </div>
      </div>
    </section>
  );
}
