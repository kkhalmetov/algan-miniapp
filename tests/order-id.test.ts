import { describe, expect, it } from 'vitest';
import { createOrderId, formatOrderId } from '../lib/order-id';

describe('order IDs', () => {
  it('creates an eight-digit numeric ID', () => {
    expect(createOrderId([], () => 0.42)).toBe('47800000');
  });

  it('avoids an existing ID', () => {
    const randomValues = [0.42, 0.5];
    expect(createOrderId(['47800000'], () => randomValues.shift() ?? 0.5)).toBe('55000000');
  });

  it('shows legacy timestamp IDs as eight digits', () => {
    expect(formatOrderId('order-1756234567890')).toBe('34567890');
  });
});
