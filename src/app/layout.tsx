import type { Metadata } from 'next';
import { Poppins, Unbounded } from 'next/font/google';

import '@/styles/global.scss';

export const metadata: Metadata = {
  title: {
    default: 'WEARLY',
    template: '%s | WEARLY',
  },
  description: 'WEARLY — online clothing store',
};

import Header from '@/widgets/Header/Header';
import Footer from '@/widgets/Footer/Footer';
import Providers from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
});

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${unbounded.variable} ${poppins.className}`}
    >
      <body>
        <Providers>
          <Header />
          <div className="container">
            <main>{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
