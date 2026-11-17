export const landingHeroSlides = [
  { id: 'lessNoise', video: '/video/v1.mp4', href: '/catalog' },
  { id: 'builtDifferent', video: '/video/v2.mp4', href: '/catalog' },
  { id: 'quietConfidence', video: '/video/v3.mp4', href: '/catalog' },
  { id: 'madeForMovement', video: '/video/v4.mp4', href: '/catalog' },
  { id: 'lessTrend', video: '/video/v5.mp4', href: '/catalog' },
] as const;

export const landingShopByItems = [
  {
    id: 'women',
    href: '/catalog/women',
    image: { src: '/images/Landing/women.png' },
  },
  {
    id: 'men',
    href: '/catalog/men',
    image: { src: '/images/Landing/men.png' },
  },
  {
    id: 'perfumes',
    href: '/catalog/fragrances',
    image: { src: '/images/Landing/perfumes.jpg' },
  },
  {
    id: 'accessories',
    href: '/catalog/accessories',
    image: { src: '/images/Landing/accessories.png' },
  },
] as const;
