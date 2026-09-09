import { describe, expect, it } from 'vitest';
import { boxes } from '../lib/mock-data';
import { canCancelOrder, createOrderPickupSnapshot, orderCancellationDeadline } from '../lib/order-cancellation';
import type { Order } from '../lib/types';

const order: Order = {
  id: '12345678',
  storeId: 'tatti',
  items: [{ boxId: 'bakery-surprise', quantity: 1, unitPrice: 2490 }],
  total: 2490,
  pickupCode: '123456',
  createdAt: '2026-08-25T10:00:00.000Z',
  pickupStartsAt: '2026-08-25T14:30:00.000Z',
  pickupEndsAt: '2026-08-25T15:30:00.000Z',
  status: 'paid',
};

describe('order cancellation rules', () => {
  it('allows cancellation through the exact three-hour boundary', () => {
    expect(orderCancellationDeadline(order)?.toISOString()).toBe('2026-08-25T11:30:00.000Z');
    expect(canCancelOrder(order, '2026-08-25T11:29:59.999Z')).toBe(true);
    expect(canCancelOrder(order, '2026-08-25T11:30:00.000Z')).toBe(true);
    expect(canCancelOrder(order, '2026-08-25T11:30:00.001Z')).toBe(false);
  });

  it('rejects completed, cancelled and undated orders', () => {
    expect(canCancelOrder({ ...order, status: 'collected' }, '2026-08-25T10:00:00.000Z')).toBe(false);
    expect(canCancelOrder({ ...order, status: 'cancelled' }, '2026-08-25T10:00:00.000Z')).toBe(false);
    expect(canCancelOrder({ ...order, pickupStartsAt: undefined }, '2026-08-25T10:00:00.000Z')).toBe(false);
    expect(canCancelOrder({ ...order, pickupStartsAt: 'invalid' }, '2026-08-25T10:00:00.000Z')).toBe(false);
  });

  it('snapshots the earliest start and latest end for a grouped order', () => {
    expect(createOrderPickupSnapshot('2026-08-25T10:00:00.000Z', [
      { boxId: 'bakery-surprise', quantity: 1, unitPrice: 2490 },
      { boxId: 'tatti-defined', quantity: 1, unitPrice: 2390 },
    ], boxes)).toEqual({
      pickupStartsAt: '2026-08-25T13:30:00.000Z',
      pickupEndsAt: '2026-08-25T15:30:00.000Z',
    });
  });
});
