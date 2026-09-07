'use client';

import { useEffect } from 'react';
import { AppErrorFallback } from '@/components/app-error';
import './fonts.css';
import './globals.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application startup failed', error);
  }, [error]);

  return (
    <html lang="kk">
      <body><AppErrorFallback onRetry={reset} /></body>
    </html>
  );
}
