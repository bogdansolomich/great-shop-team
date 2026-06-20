'use client';

import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import ClothingProductCard from './ClothingProductCard';
import { landingSection } from '../landingSectionClasses';

/** Блок 1: Recently released — одежда */
export default function RecentlyReleasedSection() {
  const { clothing, labels } = useLandingData();

  return (
    <section className={landingSection.section}>
      <div className={landingSection.sectionContent}>
        <h2 className={landingSection.sectionTitle}>{labels.recentlyReleased}</h2>
        <div className={landingSection.productGrid}>
          {clothing.map((product) => (
            <ClothingProductCard key={product.title} {...product} />
          ))}
        </div>
        <div className={landingSection.sectionCta}>
          <Link href="/catalog" className="btn-primary">
            {labels.viewAllProducts}
          </Link>
        </div>
      </div>
    </section>
  );
}
