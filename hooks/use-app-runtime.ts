'use client';

import { useCallback, useEffect, useState } from 'react';
import { authenticateTelegram } from '@/lib/api';
import { fetchKztToRubRate } from '@/lib/currency';
import { prepareTelegram, telegramProfile } from '@/lib/telegram';
import type { Currency, Locale, UserProfile } from '@/lib/types';

export const MINIMUM_SPLASH_MS = 750;
const TELEGRAM_SYNC_DELAYS_MS = [0, 250, 750, 1500, 3000] as const;

type SyncTelegramProfile = (
  profile: Pick<UserProfile, 'telegramId' | 'firstName' | 'lastName' | 'photoUrl'>,
) => void;

export function useMinimumSplashDelay() {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setElapsed(true), MINIMUM_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return elapsed;
}

export function useTelegramRuntime(onboardingDone: boolean, syncTelegramProfile: SyncTelegramProfile) {
  const syncFromTelegram = useCallback(() => {
    prepareTelegram();
    const profile = telegramProfile();
    if (!profile.isTelegram || !onboardingDone) return false;
    syncTelegramProfile({
      telegramId: profile.telegramId,
      firstName: profile.firstName,
      lastName: profile.lastName || undefined,
      photoUrl: profile.photoUrl || undefined,
    });
    return true;
  }, [onboardingDone, syncTelegramProfile]);

  useEffect(() => {
    const retryTimers = new Set<number>();
    let lastScheduledAt = Number.NEGATIVE_INFINITY;

    const scheduleTelegramSync = () => {
      const now = Date.now();
      if (now - lastScheduledAt < 200) return;
      lastScheduledAt = now;
      TELEGRAM_SYNC_DELAYS_MS.forEach((delay) => {
        const timer = window.setTimeout(() => {
          retryTimers.delete(timer);
          if (syncFromTelegram()) {
            retryTimers.forEach((pendingTimer) => window.clearTimeout(pendingTimer));
            retryTimers.clear();
          }
        }, delay);
        retryTimers.add(timer);
      });
    };

    const syncWhenVisible = () => {
      if (!document.hidden) scheduleTelegramSync();
    };

    scheduleTelegramSync();
    window.addEventListener('focus', scheduleTelegramSync);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('focus', scheduleTelegramSync);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [syncFromTelegram]);

  useEffect(() => {
    void authenticateTelegram().catch(() => undefined);
  }, []);
}

export function useDocumentLanguage(locale: Locale) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}

export function useCurrencyRate(currency: Currency, setCurrency: (currency: Currency) => void) {
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (currency !== 'RUB') return;
    const controller = new AbortController();
    void fetchKztToRubRate(controller.signal)
      .then(setRate)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setRate(null);
        setError(true);
        setCurrency('KZT');
      });
    return () => controller.abort();
  }, [currency, setCurrency]);

  const toggleCurrency = useCallback(() => {
    setError(false);
    if (currency === 'RUB') {
      setCurrency('KZT');
      return;
    }
    setRate(null);
    setCurrency('RUB');
  }, [currency, setCurrency]);

  return { rate, error, toggleCurrency };
}
