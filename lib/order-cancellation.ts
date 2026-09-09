import { shymkentClockToIso } from './date';
import type { Box, Order, OrderItem } from './types';

export const ORDER_CANCELLATION_LEAD_TIME_MS = 3 * 60 * 60 * 1000;

export function createOrderPickupSnapshot(createdAt: string, items: OrderItem[], catalog: Box[]) {
  const orderBoxes = items.flatMap((item) => {
    const box = catalog.find((candidate) => candidate.id === item.boxId);
    return box ? [box] : [];
  });
  const pickupFrom = orderBoxes.map((box) => box.pickupFrom).sort()[0];
  const pickupTo = orderBoxes.map((box) => box.pickupTo).sort().at(-1);

  return {
    pickupStartsAt: pickupFrom ? shymkentClockToIso(createdAt, pickupFrom) : undefined,
    pickupEndsAt: pickupTo ? shymkentClockToIso(createdAt, pickupTo) : undefined,
  };
}

export function orderCancellationDeadline(order: Order) {
  if (!order.pickupStartsAt) return undefined;
  const pickupStartsAt = new Date(order.pickupStartsAt).getTime();
  if (Number.isNaN(pickupStartsAt)) return undefined;
  return new Date(pickupStartsAt - ORDER_CANCELLATION_LEAD_TIME_MS);
}

export function canCancelOrder(order: Order, now: string | Date = new Date()) {
  if (order.status !== 'paid') return false;
  const deadline = orderCancellationDeadline(order);
  const nowDate = now instanceof Date ? now : new Date(now);
  return Boolean(deadline && !Number.isNaN(nowDate.getTime()) && nowDate.getTime() <= deadline.getTime());
}
