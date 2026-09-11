'use client';

import { AlertTriangle, Mail } from '@/components/icons';
import { AlganLogo } from '@/components/algan-logo';
import { IconBadge, LinkRow, PageTitle, PrimaryButton, SurfaceCard } from '@/components/ui-kit';
import { useAppStore } from '@/lib/store';
import { getCopy } from '@/lib/translations';
import type { Locale } from '@/lib/types';

export function AppErrorFallback({ onRetry, locale: localeOverride }: { onRetry: () => void; locale?: Locale }) {
  const storedLocale = useAppStore((state) => state.locale);
  const t = getCopy(localeOverride ?? storedLocale);
  return (
    <main className="flex min-h-[var(--algan-viewport-height)] items-center bg-canvas px-page py-8 text-ink sm:px-page-wide">
      <SurfaceCard className="mx-auto w-full max-w-[420px] p-5">
        <AlganLogo markClassName="h-9 w-9" wordmarkClassName="h-7 w-[85px]" />
        <IconBadge aria-hidden="true" className="mt-8" tone="danger" size="lg">
          <AlertTriangle size={26} />
        </IconBadge>
        <PageTitle className="mt-5">{t('appErrorTitle')}</PageTitle>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{t('appErrorText')}</p>
        <PrimaryButton className="mt-6" onClick={onRetry}>{t('appErrorRetry')}</PrimaryButton>
        <LinkRow className="mt-3" href="mailto:algansupport@gmail.com" icon={<Mail size={18} />} title={t('appErrorSupport')} subtitle="algansupport@gmail.com" />
      </SurfaceCard>
    </main>
  );
}
