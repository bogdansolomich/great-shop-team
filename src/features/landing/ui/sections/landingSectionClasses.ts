export const landingSection = {
  breakout: 'w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]',
  section: 'mb-[100px]',
  sectionHeader: 'mb-8 flex items-baseline justify-between',
  sectionTitle:
    'm-0 mb-8 font-(family-name:--font-unbounded) text-xl font-semibold leading-tight text-black/60',
  sectionContent: 'mx-auto w-full max-w-[1279px] max-lg:max-w-[846px] max-md:max-w-[413px]',
  sectionContentBanners: 'mx-auto w-full max-w-[1280px] max-md:max-w-[630px]',
  sectionContentPromo: 'mx-auto w-full max-w-[1440px]',
  productGrid: 'grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1',
  sectionCta: 'mt-20 flex justify-center',
  viewAll: 'text-base font-light underline underline-offset-4',
} as const;
