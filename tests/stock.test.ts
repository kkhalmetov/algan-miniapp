import { describe, expect, it } from 'vitest';
import { formatBoxesLeft } from '../lib/stock';

describe('box stock copy', () => {
  it.each([
    [0, 'Боксы закончились'],
    [1, 'Остался 1 бокс'],
    [2, 'Осталось 2 бокса'],
    [4, 'Осталось 4 бокса'],
    [5, 'Осталось 5 боксов'],
    [11, 'Осталось 11 боксов'],
    [21, 'Остался 21 бокс'],
    [24, 'Осталось 24 бокса'],
  ])('formats %i boxes in Russian', (quantity, expected) => {
    expect(formatBoxesLeft(quantity, 'ru')).toBe(expected);
  });

  it('formats available and sold-out boxes in Kazakh', () => {
    expect(formatBoxesLeft(4, 'kk')).toBe('4 бокс қалды');
    expect(formatBoxesLeft(0, 'kk')).toBe('Бокстар аяқталды');
  });
});
