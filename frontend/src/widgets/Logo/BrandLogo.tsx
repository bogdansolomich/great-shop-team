type BrandLogoProps = {
  size?: 'header' | 'footer';
};

export default function BrandLogo({ size = 'header' }: BrandLogoProps) {
  const isFooter = size === 'footer';

  return (
    <span
      className={`inline-flex flex-col items-start gap-0 font-(family-name:--font-unbounded) leading-none font-bold tracking-[-0.07em] ${
        isFooter ? 'text-white' : 'translate-y-1 text-black'
      }`}
    >
      <span className={isFooter ? 'text-[24px] sm:text-[28px]' : 'text-[15px] sm:text-[28px]'}>
        WEARLY
      </span>
      <span
        className={`tracking-[0.12em] ${
          isFooter ? 'text-[10px] sm:text-xs' : 'text-[7px] sm:text-[8px]'
        }`}
      >
        SHOP
      </span>
    </span>
  );
}
