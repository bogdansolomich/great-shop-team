'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useLandingData } from '@/features/landing/lib/useLandingData';

import sectionStyles from '../LandingSection.module.scss';
import styles from './CategoryBannersSection.module.scss';

/** Блок 2: Urban Essentials + Oversized Tailoring */
export default function CategoryBannersSection() {
  const { categories, labels } = useLandingData();

  return (
    <section className={sectionStyles.section}>
      <div className={sectionStyles.sectionContentBanners}>
        <div className={styles.grid}>
          {categories.map((item) => (
            <article key={item.title} className={styles.banner}>
              <div className={styles.image} aria-hidden>
                <Image src={item.image.src} alt="" fill sizes="630px" />
              </div>
              {item.thumb.src && (
                <div className={styles.thumb}>
                  <Image
                    src={item.thumb.src}
                    alt={item.thumb.alt}
                    width={118}
                    height={140}
                    className={styles.thumbImage}
                  />
                </div>
              )}
              <div className={styles.content}>
                <h2 className={styles.title}>{item.title}</h2>
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
