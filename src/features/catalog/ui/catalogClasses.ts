export const catalogSection = {
  banner:
    'relative -mx-[calc(50vw-50%)] mb-20 h-[clamp(520px,59.03vw,850px)] w-screen overflow-hidden bg-cover bg-center bg-no-repeat after:pointer-events-none after:absolute after:inset-0 after:bg-black/20 max-md:bg-[center_22%] md:bg-[center_18%]',
  bannerContent:
    'layout-gutter relative z-1 mx-0 mr-auto box-border flex h-full w-full max-w-[600px] flex-col justify-center pt-[calc(--site-header-height+24px)] pb-16',
  bannerTitle:
    'm-0 mb-6 max-w-[560px] font-(family-name:--font-unbounded) text-4xl leading-[1.15] font-bold text-white max-md:text-[36px]',
  bannerDescription: 'm-0 mb-8 text-base leading-relaxed text-white',
} as const;

export const catalogPage = {
  content: 'scroll-mt-(--site-header-height)',
} as const;

export const catalogToolbar = {
  root: 'mb-[60px] flex items-center justify-between',
  controls: 'flex items-center gap-8',
  control: 'flex cursor-pointer border-0 bg-transparent px-4 text-inherit [&_svg]:ml-2.5',
  stylesCount: 'font-light',
} as const;

export const catalogGrid = {
  root: 'grid grid-cols-3 gap-5',
} as const;

export const catalogProductCard = {
  root: 'mb-[100px]',
  imageWrap: 'relative mb-4 [&_img]:h-auto [&_img]:w-full',
  addToCartBtn:
    'absolute right-4 bottom-4 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-none bg-black text-white',
  meta: 'mb-4 flex justify-between',
} as const;

export const catalogLoadMore = {
  root: 'mt-5 text-center',
  summary: 'mb-6 font-light',
  button: 'cursor-pointer border-none bg-black px-4 py-2.5 font-medium text-white',
} as const;
