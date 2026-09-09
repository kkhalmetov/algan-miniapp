import { createOrderId, createPickupCode } from './order-id';
import { availableQuantity } from './app-utils';
import { createOrderPickupSnapshot } from './order-cancellation';
import type { Box, CartItem, Order } from './types';

interface CreateCheckoutOrderOptions {
  boxes: Box[];
  cartItems: CartItem[];
  cartStoreId?: string;
  existingOrders: Order[];
  purchasedBoxQuantities: Record<string, number>;
  createdAt?: string;
}

export function createCheckoutOrder({
  boxes,
  cartItems,
  cartStoreId,
  existingOrders,
  purchasedBoxQuantities,
  createdAt = new Date().toISOString(),
}: CreateCheckoutOrderOptions): Order | null {
  const items = cartItems.flatMap((cartItem) => {
    const box = boxes.find((candidate) => candidate.id === cartItem.boxId);
    if (!box) return [];
    const quantity = Math.min(cartItem.quantity, availableQuantity(box, purchasedBoxQuantities));
    if (quantity < 1) return [];
    return [{ boxId: box.id, quantity, unitPrice: box.salePrice }];
  });

  if (items.length === 0) return null;

  const pickup = createOrderPickupSnapshot(createdAt, items, boxes);

  return {
    id: createOrderId(existingOrders.map((order) => order.id)),
    storeId: cartStoreId ?? boxes.find((box) => box.id === items[0]?.boxId)?.storeId ?? '',
    items,
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    pickupCode: createPickupCode(existingOrders.map((order) => order.pickupCode)),
    createdAt,
    ...pickup,
    status: 'paid',
  };
}
