import { describe, expect, it } from 'vitest';
import { createCheckoutOrder } from '../lib/checkout';
import { boxes } from '../lib/mock-data';

describe('checkout order creation', () => {
  it('turns valid cart lines into a priced order', () => {
    const box = boxes[0]!;
    const order = createCheckoutOrder({
      boxes,
      cartItems: [{ boxId: box.id, quantity: 2 }],
      cartStoreId: box.storeId,
      existingOrders: [],
      purchasedBoxQuantities: {},
      createdAt: '2026-09-07T12:00:00.000Z',
    });

    expect(order).toMatchObject({
      storeId: box.storeId,
      items: [{ boxId: box.id, quantity: 2, unitPrice: box.salePrice }],
      total: box.salePrice * 2,
      createdAt: '2026-09-07T12:00:00.000Z',
      status: 'paid',
    });
    expect(order?.id).toMatch(/^\d{8}$/);
    expect(order?.pickupCode).toMatch(/^\d{6}$/);
  });

  it('caps quantities to remaining stock and drops unavailable lines', () => {
    const availableBox = boxes[0]!;
    const unavailableBox = boxes[1]!;
    const order = createCheckoutOrder({
      boxes,
      cartItems: [
        { boxId: availableBox.id, quantity: 20 },
        { boxId: unavailableBox.id, quantity: 1 },
        { boxId: 'missing-box', quantity: 1 },
      ],
      existingOrders: [],
      purchasedBoxQuantities: {
        [availableBox.id]: availableBox.quantity - 1,
        [unavailableBox.id]: unavailableBox.quantity,
      },
    });

    expect(order?.items).toEqual([{ boxId: availableBox.id, quantity: 1, unitPrice: availableBox.salePrice }]);
  });

  it('does not create an order when no cart line can be fulfilled', () => {
    const box = boxes[0]!;
    expect(createCheckoutOrder({
      boxes,
      cartItems: [{ boxId: box.id, quantity: 1 }],
      existingOrders: [],
      purchasedBoxQuantities: { [box.id]: box.quantity },
    })).toBeNull();
  });
});
