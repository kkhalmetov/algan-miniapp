import { describe, expect, it } from 'vitest';
import { formatOrderDate } from '../lib/date';

describe('order date presentation', () => {
  it('uses stable Russian and Kazakh month names', () => {
    expect(formatOrderDate('2026-08-25T10:00:00.000Z', 'ru')).toBe('25 августа 2026 г.');
    expect(formatOrderDate('2026-08-25T10:00:00.000Z', 'kk')).toBe('25 тамыз 2026 ж.');
  });

  it('uses the Shymkent date near the UTC day boundary', () => {
    expect(formatOrderDate('2026-08-24T21:30:00.000Z', 'ru')).toBe('25 августа 2026 г.');
    expect(formatOrderDate('2026-08-24T21:30:00.000Z', 'kk')).toBe('25 тамыз 2026 ж.');
  });
});
