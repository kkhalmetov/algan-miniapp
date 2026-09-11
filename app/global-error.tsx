'use client';

import { useEffect } from 'react';
import { AppErrorFallback } from '@/components/app-error';
import { useAppStore } from '@/lib/store';
import './fonts.css';
import './globals.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useAppStore((state) => state.locale);
  useEffect(() => {
    console.error('Application startup failed', error);
  }, [error]);

  return (
    <html lang={locale}>
      <body><AppErrorFallback locale={locale} onRetry={reset} /></body>
    </html>
  );
}
