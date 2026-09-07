import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { BRAND_COLOR } from '@/lib/design-tokens';
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://algan-bot.online'),
  title: 'Algan — тиімді ұсыныстар жаныңызда',
  description: 'Шымкенттегі сүйікті мекемелерден тиімді бағамен бокстар.',
  applicationName: 'Algan',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/algan-mark.svg?v=3',
  },
  openGraph: {
    title: 'Algan — тиімді ұсыныстар жаныңызда',
    description: 'Шымкенттегі сүйікті мекемелерден тиімді бағамен бокстар.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Algan — тиімді ұсыныстар жаныңызда',
    description: 'Шымкенттегі сүйікті мекемелерден тиімді бағамен бокстар.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: BRAND_COLOR,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
