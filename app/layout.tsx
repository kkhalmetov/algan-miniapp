import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://algan-bot.online'),
  title: 'Algan — спасаем еду вместе',
  description: 'Боксы из кофеен, пекарен и магазинов Шымкента со скидкой.',
  icons: {
    icon: '/algan-mark.svg?v=2',
  },
  openGraph: {
    title: 'Algan — спасаем еду вместе',
    description: 'Вкусные боксы со скидкой в Шымкенте.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Algan — спасаем еду вместе',
    description: 'Вкусные боксы со скидкой в Шымкенте.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1f5c49',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
