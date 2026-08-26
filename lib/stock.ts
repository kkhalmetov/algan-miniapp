import type { Locale } from './types';

export function formatBoxesLeft(quantity: number, locale: Locale) {
  const count = Math.max(0, Math.trunc(quantity));

  if (locale === 'kk') return count === 0 ? 'Бокстар аяқталды' : `${count} бокс қалды`;
  if (count === 0) return 'Боксы закончились';

  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastDigit === 1 && lastTwoDigits !== 11) return `Остался ${count} бокс`;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `Осталось ${count} бокса`;
  }
  return `Осталось ${count} боксов`;
}
