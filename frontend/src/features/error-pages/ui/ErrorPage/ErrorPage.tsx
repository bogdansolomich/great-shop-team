import Image from 'next/image';
import Link from 'next/link';

import { catalogRoutes } from '@/features/catalog/config/catalogRoutes';

type ErrorPageProps = {
  errorCode: string;
  title: string;
  description: string;
};

export default function ErrorPage({ errorCode, title, description }: ErrorPageProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#EEE]">
      <section className="mx-auto grid w-full max-w-360 items-center gap-8 px-6 py-8 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,567px)] lg:gap-18 lg:px-18.5 lg:py-[clamp(1.25rem,4vh,4.75rem)]">
        <div className="max-w-144.5 lg:pl-0.75">
          <p className="m-0 font-(family-name:--font-pt-sans-caption) text-[clamp(24px,3.6vh,40px)] leading-none font-normal text-black">
            Error {errorCode}
          </p>

          <h1 className="m-0 mt-[clamp(12px,3.4vh,38px)] font-(family-name:--font-pt-sans-caption) text-[clamp(72px,13.5vh,150px)] leading-[0.88] font-bold text-black">
            {errorCode}
          </h1>

          <h2 className="m-0 mt-[clamp(10px,3.2vh,36px)] font-(family-name:--font-pt-sans-caption) text-[clamp(28px,5.4vh,60px)] leading-[1.05] font-normal text-black">
            {title}
          </h2>

          <p className="m-0 mt-[clamp(12px,5vh,58px)] max-w-114.25 font-(family-name:--font-pt-sans-caption) text-[clamp(16px,2vh,22px)] leading-[1.5] font-normal text-black">
            {description}
          </p>

          <div className="mt-[clamp(16px,8vh,140px)] flex flex-col gap-4 sm:flex-row lg:gap-14">
            <Link
              href="/"
              className="flex h-12 w-full max-w-60 items-center justify-center rounded-lg bg-[#4D4D4D] px-3.5 text-center font-(family-name:--font-unbounded) text-[18px] leading-none font-normal text-[#FAFAFA] no-underline transition-opacity hover:opacity-90"
            >
              Go to Homepage
            </Link>

            <Link
              href={catalogRoutes.index}
              className="flex h-12 w-full max-w-60 items-center justify-center rounded-lg border border-[#4D4D4D] px-3.5 text-center font-(family-name:--font-unbounded) text-[18px] leading-none font-normal text-[#4D4D4D] no-underline transition-colors hover:bg-[#4D4D4D] hover:text-[#FAFAFA]"
            >
              Shop New In
            </Link>
          </div>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <Image
            src="/images/alina-bordunova-Lq78VGxRJhc-unsplash.jpg"
            alt="Fashion model walking"
            width={567}
            height={807}
            priority
            className="h-auto max-h-[min(807px,calc(100dvh-4.5rem))] w-auto max-w-full object-contain"
          />
        </div>
      </section>
    </main>
  );
}
