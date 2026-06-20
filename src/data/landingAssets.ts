export const landingClothingItems = [
  { id: 'essentialTee', image: { src: '/images/Landing/Essential%20Oversized%20T-Shirt.png' } },
  { id: 'roseTee', image: { src: '/images/Landing/Rose%20Oversized%20T-Shirt.png' } },
  { id: 'heritageTee', image: { src: '/images/Landing/Heritage%20Graphic%20T-Shirt.png' } },
] as const;

export const landingFragranceItems = [
  {
    id: 'tobaccoVanille',
    image: { src: '/images/Landing/TobaccoVanille.png' },
    sizes: ['10 ml', '50 ml', '100 ml'],
  },
  {
    id: 'lostCherry',
    image: { src: '/images/Landing/LostCherry.png' },
    sizes: ['10 ml', '50 ml', '100 ml'],
  },
  {
    id: 'vanillaSex',
    image: { src: '/images/Landing/VanillaSex.png' },
    sizes: ['10 ml', '50 ml', '100 ml'],
  },
] as const;

export const landingCategoryItems = [
  {
    id: 'urbanEssentials',
    href: '/catalog',
    image: { src: '/images/Landing/Frame2.png' },
    thumb: { src: '/images/Landing/Frame3.png' },
  },
  {
    id: 'oversizedTailoring',
    href: '/catalog',
    image: { src: '/images/Landing/Frame1.png' },
    thumb: { src: '/images/Landing/Frame4.png' },
  },
] as const;

export const landingLifestyleImage = {
  src: '/images/Landing/LifestyleSection.png',
} as const;
