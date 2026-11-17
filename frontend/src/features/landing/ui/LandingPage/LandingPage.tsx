import BenefitsSection from '../sections/BenefitsSection/BenefitsSection';
import BestSellersSection from '../sections/BestSellersSection/BestSellersSection';
import FragranceBannerSection from '../sections/FragranceBannerSection/FragranceBannerSection';
import HeroSection from '../sections/HeroSection/HeroSection';
import ShopBySection from '../sections/ShopBySection/ShopBySection';

export default function LandingPage() {
  return (
    <div className="pb-10">
      <HeroSection />
      <BestSellersSection />
      <FragranceBannerSection />
      <BenefitsSection />
      <ShopBySection />
    </div>
  );
}
