export const landingSection = {
  breakout: 'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2',
  section: 'mb-12 md:mb-20 lg:mb-[100px]',
  sectionTitle:
    'm-0 font-(family-name:--font-unbounded) text-[18px] font-medium tracking-wide text-black/60 md:text-[20px]',
  sectionContent: 'mx-auto w-full max-w-[1280px]',
  productGrid: 'grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-5',
  viewAll:
    'inline-flex min-h-11 shrink-0 items-center font-(family-name:--font-pt-sans-caption) text-[14px] font-normal text-dark no-underline transition-opacity hover:opacity-60',
  carouselBtn:
    'flex size-10 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-white text-dark transition-colors hover:bg-[#f5f5f5] md:size-9',
} as const;
