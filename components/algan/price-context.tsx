'use client';

import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Currency, Locale } from '@/lib/types';

interface PriceContextValue {
  currency: Currency;
  kztToRubRate: number | null;
}

const PriceContext = createContext<PriceContextValue>({ currency: 'KZT', kztToRubRate: null });

export function PriceProvider({ currency, kztToRubRate, children }: PriceContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ currency, kztToRubRate }), [currency, kztToRubRate]);
  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;
}

export function usePriceFormatter(locale: Locale) {
  const { currency, kztToRubRate } = useContext(PriceContext);
  return useCallback(
    (value: number) => formatCurrency(value, locale, currency, kztToRubRate),
    [currency, kztToRubRate, locale],
  );
}
