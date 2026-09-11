import type { Currency, Locale } from './types';

export const KZT_RUB_RATE_URL = 'https://open.er-api.com/v6/latest/KZT';

export async function fetchKztToRubRate(signal?: AbortSignal) {
  const response = await fetch(KZT_RUB_RATE_URL, { signal });
  if (!response.ok) throw new Error(`Exchange rate request failed: ${response.status}`);
  const payload = await response.json() as { result?: unknown; rates?: { RUB?: unknown } };
  const rate = payload.rates?.RUB;
  if (payload.result !== 'success' || typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Exchange rate response is invalid');
  }
  return rate;
}

export function formatCurrency(valueKzt: number, locale: Locale, currency: Currency, kztToRubRate?: number | null) {
  // Some Telegram WebViews fall back to English grouping for kk-KZ.
  // Keep the same unambiguous spacing and decimal separator in both app languages.
  const formatAmount = (value: number) => new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : 'ru-KZ')
    .formatToParts(value)
    .map((part) => part.type === 'group' ? '\u00a0' : part.type === 'decimal' ? ',' : part.value)
    .join('');
  if (currency === 'RUB' && kztToRubRate) {
    const rubles = Math.round(valueKzt * kztToRubRate);
    return `${formatAmount(rubles)} ₽`;
  }
  return `${formatAmount(valueKzt)} ₸`;
}
