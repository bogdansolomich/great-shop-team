import '@/styles/global.scss';

import Header from '@/widgets/Header/Header';
import Footer from '@/widgets/Footer/Footer';
import Providers from './providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Header */}
          <Header />

          {/* Main content */}
          <main>{children}</main>

          {/* Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
