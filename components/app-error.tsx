'use client';

import { AlertTriangle, Mail } from 'lucide-react';
import { AlganLogo } from '@/components/algan-logo';
import { IconBadge, LinkRow, PageTitle, PrimaryButton, SurfaceCard } from '@/components/ui-kit';

export function AppErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-[var(--algan-viewport-height)] items-center bg-canvas px-page py-8 text-ink sm:px-page-wide">
      <SurfaceCard className="mx-auto w-full max-w-[420px] p-5">
        <AlganLogo markClassName="h-9 w-9" wordmarkClassName="h-7 w-[85px]" />
        <IconBadge aria-hidden="true" className="mt-8" tone="danger" size="lg">
          <AlertTriangle size={26} />
        </IconBadge>
        <PageTitle className="mt-5">Қосымшаны жүктеу мүмкін болмады</PageTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Не удалось загрузить приложение. Проверьте соединение и попробуйте ещё раз.</p>
        <PrimaryButton className="mt-6" onClick={onRetry}>Қайталап көру · Попробовать снова</PrimaryButton>
        <LinkRow className="mt-3" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title="Қолдау · Поддержка" subtitle="algansupport@gmail.com" />
      </SurfaceCard>
    </main>
  );
}
