'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import NewsletterForm from '@/widgets/Footer/NewsletterForm';

import styles from './Footer.module.scss';

type FooterLinkItem = {
  label: string;
  href: string;
  icon?: string;
};

type FooterColumn = {
  title: string;
  links: FooterLinkItem[];
};

function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = className ?? styles.link;
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
        title: t.footer.columns.company.title,
        links: [
          { label: t.footer.columns.company.aboutUs, href: '/about' },
          { label: t.footer.columns.company.careers, href: '/careers' },
          { label: t.footer.columns.company.contacts, href: '/contacts' },
        ],
      },
      {
        title: t.footer.columns.helpCenter.title,
        links: [
          { label: t.footer.columns.helpCenter.shipping, href: '/shipping' },
          { label: t.footer.columns.helpCenter.returns, href: '/returns' },
          { label: t.footer.columns.helpCenter.faq, href: '/faq' },
          { label: t.footer.columns.helpCenter.sizeGuide, href: '/size-guide' },
        ],
      },
      {
        title: t.footer.columns.legal.title,
        links: [
          { label: t.footer.columns.legal.privacyPolicy, href: '/privacy' },
          { label: t.footer.columns.legal.terms, href: '/terms' },
          { label: t.footer.columns.legal.cookies, href: '/cookies' },
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
          {
            label: t.footer.columns.social.facebook,
            href: '/facebook',
            icon: '/icons/Facebook.svg',
          },
          { label: t.footer.columns.social.tiktok, href: '/tiktok', icon: '/icons/tiktok.svg' },
        ],
      },
    ],
    [t],
  );

  const links = (
    <div className={styles.linksColumn}>
      {footerColumns.map((column) => (
        <div key={column.title} className={styles.column}>
          <h2 className={styles.columnTitle}>{column.title}</h2>
          <ul className={styles.linkList}>
            {column.links.map((link) => (
              <li key={link.label}>
                <FooterLink
                  href={link.href}
                  className={link.icon ? `${styles.link} ${styles.linkWithIcon}` : styles.link}
                >
                  {link.icon ? (
                    <>
                      <Image src={link.icon} alt="" width={24} height={24} aria-hidden />
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
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.leftCol}>
            <Link href="/" className={styles.logo} aria-label="WEARLY — home">
              <Image src="/icons/WEARLY.svg" alt="WEARLY Logo" width={270} height={50} priority />
            </Link>
            <h2 className={styles.newsletterTitle}>{t.footer.newsletterTitle}</h2>
            <div className={styles.stretch} aria-hidden />
          </div>

          <div className={styles.rightCol}>
            {links}
            <div className={styles.stretch} aria-hidden />
          </div>

          <div className={styles.baselineRow}>
            <NewsletterForm />
            <div className={styles.divider} aria-hidden />
          </div>

          <div className={styles.bottomRow}>
            <p className={styles.copyright}>{t.footer.copyright}</p>
            <div className={styles.payments}>
              <Image src="/icons/applepay.svg" alt="Apple Pay" width={40} height={40} />
              <Image src="/icons/master-card.svg" alt="Mastercard" width={40} height={40} />
              <Image src="/icons/visa-1.svg" alt="Visa" width={40} height={40} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
