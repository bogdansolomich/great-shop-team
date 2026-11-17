'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import NewsletterForm from '@/widgets/Footer/NewsletterForm';
import BrandLogo from '@/widgets/Logo/BrandLogo';

type FooterLinkItem = {
  label: string;
  href: string;
  icon?: string;
};

type FooterColumn = {
  title: string;
  links: FooterLinkItem[];
};

const linkClass =
  'cursor-pointer text-sm leading-snug font-normal text-white/75 no-underline transition-opacity duration-200 hover:text-white';

function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = className ?? linkClass;
  const isExternal = href.startsWith('http');

  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  const footerColumns: FooterColumn[] = useMemo(
    () => [
      {
        title: t.footer.columns.info.title,
        links: [
          { label: t.footer.columns.info.contacts, href: '/contacts' },
          { label: t.footer.columns.info.shippingReturns, href: '/shipping' },
        ],
      },
      {
        title: t.footer.columns.legal.title,
        links: [
          { label: t.footer.columns.legal.privacyPolicy, href: '/privacy' },
          { label: t.footer.columns.legal.terms, href: '/terms' },
        ],
      },
      {
        title: t.footer.columns.social.title,
        links: [
          {
            label: t.footer.columns.social.instagram,
            href: '/instagram',
            icon: '/icons/Instagram.svg',
          },
          { label: t.footer.columns.social.tiktok, href: '/tiktok', icon: '/icons/TikTok.svg' },
        ],
      },
    ],
    [t],
  );

  const paymentIcons = (
    <div className="flex items-center justify-start gap-2">
      <Image
        src="/icons/applepay.svg"
        alt="Apple Pay"
        width={40}
        height={26}
        className="h-6 w-auto"
      />
      <Image
        src="/icons/master-card.svg"
        alt="Mastercard"
        width={40}
        height={26}
        className="h-6 w-auto"
      />
      <Image src="/icons/visa-1.svg" alt="Visa" width={40} height={26} className="h-6 w-auto" />
    </div>
  );

  return (
    <footer className="bg-[#111111] py-8 pb-[max(2rem,env(safe-area-inset-bottom))] font-(family-name:--font-pt-sans-caption) text-white md:py-10">
      <div className="layout-container mx-auto box-border w-full max-w-[1440px]">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-16">
          <div className="flex w-full min-w-0 max-w-[420px] flex-col gap-8">
            <Link href="/" className="inline-flex max-w-full" aria-label="WEARLY — home">
              <BrandLogo size="footer" />
            </Link>

            <div className="flex flex-col gap-3">
              <h2 className="m-0 font-(family-name:--font-unbounded) text-xl leading-tight font-medium tracking-tight">
                {t.footer.newsletterTitle}
              </h2>
              <NewsletterForm />
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="w-full min-w-0 border-b border-white pb-4 lg:justify-self-end"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-8">
              {footerColumns.map((column) => (
                <div key={column.title} className="flex min-w-0 flex-col gap-3">
                  <h2 className="m-0 font-(family-name:--font-unbounded) text-sm leading-tight font-medium text-white">
                    {column.title}
                  </h2>
                  <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink
                          href={link.href}
                          className={
                            link.icon
                              ? `${linkClass} inline-flex items-center gap-2`
                              : `${linkClass} break-words`
                          }
                        >
                          {link.icon ? (
                            <>
                              <Image src={link.icon} alt="" width={16} height={16} aria-hidden />
                              <span>{link.label}</span>
                            </>
                          ) : (
                            link.label
                          )}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 pr-14 md:pr-16 lg:pr-4">
          <p className="m-0 text-sm leading-normal text-white/80">{t.footer.copyright}</p>
          {paymentIcons}
        </div>
      </div>
    </footer>
  );
}
