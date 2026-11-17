'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import type { InfoPageSlug } from '@/features/content/lib/infoPages';
import { formatMessage, useTranslation } from '@/i18n/useTranslation';

const externalUrls: Partial<Record<InfoPageSlug, string>> = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/',
};

type InfoPageProps = {
  slug: InfoPageSlug;
};

function PageFrame({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <article className="w-full py-12 pb-20 text-left">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray no-underline hover:text-dark hover:underline"
      >
        {t.infoPage.backToHome}
      </Link>
      <h1 className="m-0 mb-4 font-(family-name:--font-unbounded) text-[32px] font-semibold text-dark">
        {title}
      </h1>
      {children}
    </article>
  );
}

function ContactsPage() {
  const { t } = useTranslation();
  const page = t.supportPages.contacts;
  const details = [
    { label: page.emailLabel, value: page.email, href: `mailto:${page.email}` },
    { label: page.hoursLabel, value: page.hours },
    { label: page.responseLabel, value: page.response },
  ];

  return (
    <PageFrame title={t.infoPages.contacts.title}>
      <p className="m-0 text-base leading-relaxed text-dark">{t.infoPages.contacts.description}</p>
      <h2 className="m-0 mt-10 mb-4 font-(family-name:--font-unbounded) text-xl font-medium text-dark">
        {page.supportTitle}
      </h2>
      <dl className="m-0 flex flex-col gap-3">
        {details.map((item) => (
          <div key={item.label}>
            <dt className="m-0 text-sm font-medium text-dark">{item.label}</dt>
            <dd className="m-0 mt-1 text-base leading-relaxed text-dark/80">
              {item.href ? (
                <a href={item.href} className="text-dark underline">
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="m-0 mt-10 mb-4 font-(family-name:--font-unbounded) text-xl font-medium text-dark">
        {page.helpTitle}
      </h2>
      <p className="m-0 text-base leading-relaxed text-dark">{page.helpIntro}</p>
      <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-dark/80">
        {page.helpItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="m-0 mt-6 text-base leading-relaxed text-dark">{page.orderNote}</p>
      <p className="m-0 mt-6 text-base leading-relaxed text-dark">{page.closing}</p>
      <p className="m-0 mt-6 font-(family-name:--font-unbounded) text-sm font-medium text-dark">
        {page.signoff}
      </p>
    </PageFrame>
  );
}

function ShippingPage() {
  const { t } = useTranslation();
  const page = t.supportPages.shipping;
  const options = [
    { label: page.standardLabel, value: page.standardValue },
    { label: page.expressLabel, value: page.expressValue },
    { label: page.freeLabel, value: page.freeValue },
  ];

  const sectionTitle =
    'm-0 mt-10 mb-4 font-(family-name:--font-unbounded) text-xl font-medium text-dark';

  return (
    <PageFrame title={t.infoPages.shipping.title}>
      <h2 className="m-0 mb-4 font-(family-name:--font-unbounded) text-2xl font-medium text-dark">
        {page.policyTitle}
      </h2>
      <p className="m-0 text-base leading-relaxed text-dark">{t.infoPages.shipping.description}</p>
      <h2 className={sectionTitle}>{page.optionsTitle}</h2>
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-dark/80">
        {options.map((option) => (
          <li key={option.label}>
            <span className="font-medium text-dark">{option.label}:</span> {option.value}
          </li>
        ))}
      </ul>
      <h2 className={sectionTitle}>{page.processingTitle}</h2>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.processingBody}</p>
      <h2 className={sectionTitle}>{page.infoTitle}</h2>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.infoBody}</p>
      <p className="m-0 mt-4 text-base leading-relaxed text-dark/80">
        {page.questionBefore}
        <Link href="/contacts" className="text-dark underline">
          {page.questionLink}
        </Link>
        {page.questionAfter}
      </p>
      <p className="m-0 mt-6 text-base leading-relaxed text-dark">{page.closing}</p>

      <h2 className="m-0 mt-16 mb-4 font-(family-name:--font-unbounded) text-2xl font-medium text-dark">
        {page.returnsTitle}
      </h2>
      <p className="m-0 text-base leading-relaxed text-dark">{page.returnsIntro}</p>
      <h3 className={sectionTitle}>{page.returnPolicyTitle}</h3>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.returnPolicyBody}</p>
      <h3 className={sectionTitle}>{page.howTitle}</h3>
      <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-dark/80">
        <li>
          {page.stepOneBefore}
          <Link href="/contacts" className="text-dark underline">
            {page.stepOneLink}
          </Link>
          {page.stepOneAfter}
        </li>
        <li>{page.stepTwo}</li>
        <li>{page.stepThree}</li>
      </ol>
      <h3 className={sectionTitle}>{page.refundsTitle}</h3>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.refundsBody}</p>
      <h3 className={sectionTitle}>{page.exchangesTitle}</h3>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.exchangesBody}</p>
      <h3 className={sectionTitle}>{page.damagedTitle}</h3>
      <p className="m-0 text-base leading-relaxed text-dark/80">{page.damagedBody}</p>
      <p className="m-0 mt-6 text-base leading-relaxed text-dark/80">
        {page.returnsQuestionBefore}
        <Link href="/contacts" className="text-dark underline">
          {page.returnsQuestionLink}
        </Link>
        {page.returnsQuestionAfter}
      </p>
      <p className="m-0 mt-6 text-base leading-relaxed text-dark">{page.returnsClosing}</p>
    </PageFrame>
  );
}

export default function InfoPage({ slug }: InfoPageProps) {
  const { t } = useTranslation();

  if (slug === 'contacts') return <ContactsPage />;
  if (slug === 'shipping') return <ShippingPage />;

  const page = t.infoPages[slug];
  const externalUrl = externalUrls[slug];

  return (
    <PageFrame title={page.title}>
      <p className="m-0 text-base leading-relaxed text-dark">{page.description}</p>
      {externalUrl ? (
        <a
          href={externalUrl}
          className="mt-6 inline-block rounded-lg bg-dark px-5 py-3 text-sm font-semibold text-white no-underline hover:opacity-90"
          target="_blank"
          rel="noopener noreferrer"
        >
          {formatMessage(t.infoPage.open, { title: page.title })}
        </a>
      ) : null}
    </PageFrame>
  );
}
