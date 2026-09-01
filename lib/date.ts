import type { Locale } from './types';

const ALGAN_TIME_ZONE_OFFSET_MS = 5 * 60 * 60 * 1000;

const monthNames: Record<Locale, readonly string[]> = {
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
  kk: [
    'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
    'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
  ],
};

export function formatOrderDate(value: string | Date, locale: Locale) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const shymkentDate = new Date(date.getTime() + ALGAN_TIME_ZONE_OFFSET_MS);
  const day = shymkentDate.getUTCDate();
  const month = monthNames[locale][shymkentDate.getUTCMonth()];
  const year = shymkentDate.getUTCFullYear();

  return locale === 'kk' ? `${day} ${month} ${year} ж.` : `${day} ${month} ${year} г.`;
}
