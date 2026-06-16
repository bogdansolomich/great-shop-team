import CategoryBannersSection from '../sections/CategoryBannersSection/CategoryBannersSection';
import FragrancesSection from '../sections/FragrancesSection/FragrancesSection';
import HeroSection from '../sections/HeroSection/HeroSection';
import LifestyleSection from '../sections/LifestyleSection/LifestyleSection';
import PromoSection from '../sections/PromoSection/PromoSection';
import RecentlyReleasedSection from '../sections/RecentlyReleasedSection/RecentlyReleasedSection';

import styles from './LandingPage.module.scss';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <HeroSection />
      <RecentlyReleasedSection />
      <CategoryBannersSection />
      <PromoSection />
      <FragrancesSection />
      <LifestyleSection />
    </div>
  );
}
