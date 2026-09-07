'use client';

import { useEffect } from 'react';
import { AppErrorFallback } from '@/components/app-error';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application render failed', error);
  }, [error]);

  return <AppErrorFallback onRetry={reset} />;
}
