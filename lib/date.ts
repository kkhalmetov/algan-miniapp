import type { Locale } from './types';

export const ALGAN_TIME_ZONE_OFFSET_MS = 5 * 60 * 60 * 1000;

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

export function shymkentClockToIso(dateValue: string | Date, clock: string) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const match = /^(\d{2}):(\d{2})$/.exec(clock);
  if (Number.isNaN(date.getTime()) || !match) return undefined;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;

  const shymkentDate = new Date(date.getTime() + ALGAN_TIME_ZONE_OFFSET_MS);
  const timestamp = Date.UTC(
    shymkentDate.getUTCFullYear(),
    shymkentDate.getUTCMonth(),
    shymkentDate.getUTCDate(),
    hours,
    minutes,
  ) - ALGAN_TIME_ZONE_OFFSET_MS;
  return new Date(timestamp).toISOString();
}

export function formatShymkentTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const shymkentDate = new Date(date.getTime() + ALGAN_TIME_ZONE_OFFSET_MS);
  return `${String(shymkentDate.getUTCHours()).padStart(2, '0')}:${String(shymkentDate.getUTCMinutes()).padStart(2, '0')}`;
}
