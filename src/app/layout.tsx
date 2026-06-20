import type { Metadata } from 'next';
import { Poppins, Unbounded } from 'next/font/google';

import '@/styles/global.css';

export const metadata: Metadata = {
  title: {
    default: 'WEARLY',
    template: '%s | WEARLY',
  },
  description: 'WEARLY — online clothing store',
};

import Header from '@/widgets/Header/Header';
import Footer from '@/widgets/Footer/Footer';
import MainContent from '@/widgets/MainContent/MainContent';
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
    <html lang="en" className={`${poppins.variable} ${unbounded.variable} ${poppins.className}`}>
      <body>
        <Providers>
          <Header />
          <div className="site-content">
            <div className="layout-container">
              <MainContent>{children}</MainContent>
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
