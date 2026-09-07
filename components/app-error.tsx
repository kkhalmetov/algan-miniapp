'use client';

import { AlertTriangle, Mail } from 'lucide-react';
import { AlganLogo } from '@/components/algan-logo';
import { LinkRow, PrimaryButton } from '@/components/ui-kit';

export function AppErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-[var(--algan-viewport-height)] items-center bg-canvas px-page py-8 text-ink sm:px-page-wide">
      <div className="mx-auto w-full max-w-[420px] rounded-card border border-border bg-surface p-5 shadow-card">
        <AlganLogo markClassName="h-9 w-9" wordmarkClassName="h-7 w-[85px]" />
        <span aria-hidden="true" className="mt-8 grid h-14 w-14 place-items-center rounded-[18px] bg-danger-soft text-danger">
          <AlertTriangle size={26} />
        </span>
        <h1 className="mt-5 text-page-title">Қосымшаны жүктеу мүмкін болмады</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Не удалось загрузить приложение. Проверьте соединение и попробуйте ещё раз.</p>
        <PrimaryButton className="mt-6" onClick={onRetry}>Қайталап көру · Попробовать снова</PrimaryButton>
        <LinkRow className="mt-3" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title="Қолдау · Поддержка" subtitle="algansupport@gmail.com" />
      </div>
    </main>
  );
}
