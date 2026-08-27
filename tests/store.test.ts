import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../lib/store';

describe('local MVP state', () => {
  beforeEach(() => {
    useAppStore.setState({
      onboardingDone: false,
      profile: { firstName: '' },
      location: undefined,
      locale: 'ru',
      tab: 'home',
      favoriteStoreIds: [],
      orders: [],
      cartStoreId: undefined,
      cartItems: [],
      purchasedBoxQuantities: {},
    });
  });

  it('completes onboarding and saves an optional profile', () => {
    useAppStore.getState().completeOnboarding({ firstName: 'Алия' });
    expect(useAppStore.getState().onboardingDone).toBe(true);
    expect(useAppStore.getState().profile).toEqual({ firstName: 'Алия' });
  });

  it('toggles stores in favorites without duplicates', () => {
    useAppStore.getState().toggleFavorite('tatti');
    useAppStore.getState().toggleFavorite('tatti');
    expect(useAppStore.getState().favoriteStoreIds).toEqual([]);
  });

  it('syncs Telegram identity without removing the saved phone', () => {
    useAppStore.setState({ profile: { firstName: 'Пользователь', phone: '+77001234567' } });
    useAppStore.getState().syncTelegramProfile({ telegramId: 123, firstName: 'Kimal', lastName: 'A', photoUrl: 'https://example.test/avatar.jpg' });
    expect(useAppStore.getState().profile).toEqual({
      telegramId: 123, firstName: 'Kimal', lastName: 'A', phone: '+77001234567', photoUrl: 'https://example.test/avatar.jpg',
    });
  });

  it('keeps the last working avatar when Telegram omits photo_url', () => {
    useAppStore.setState({ profile: { telegramId: 123, firstName: 'Kimal', photoUrl: 'https://example.test/avatar.jpg' } });
    useAppStore.getState().syncTelegramProfile({ telegramId: 123, firstName: 'Kimal', lastName: undefined, photoUrl: undefined });
    expect(useAppStore.getState().profile.photoUrl).toBe('https://example.test/avatar.jpg');
  });

  it('does not reuse an avatar after switching Telegram accounts', () => {
    useAppStore.setState({ profile: { telegramId: 123, firstName: 'Kimal', photoUrl: 'https://example.test/avatar.jpg' } });
    useAppStore.getState().syncTelegramProfile({ telegramId: 456, firstName: 'Алия', lastName: undefined, photoUrl: undefined });
    expect(useAppStore.getState().profile).toMatchObject({ telegramId: 456, firstName: 'Алия' });
    expect(useAppStore.getState().profile.photoUrl).toBeUndefined();
  });

  it('updates only the saved phone number', () => {
    useAppStore.setState({ profile: { firstName: 'Kimal', phone: '+77001234567' } });
    useAppStore.getState().updatePhone('+77771234567');
    expect(useAppStore.getState().profile).toEqual({ firstName: 'Kimal', phone: '+77771234567' });
  });

  it('adds paid demo orders to the top of history', () => {
    useAppStore.getState().addOrder({
      id: 'order-1', boxId: 'bakery-surprise', quantity: 1, total: 2490,
      pickupCode: '1234', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid',
    });
    expect(useAppStore.getState().orders[0]?.pickupCode).toBe('1234');
  });

  it('adds, changes and removes box quantities in the cart', () => {
    const store = useAppStore.getState();
    store.setCartItemQuantity('bakery-surprise', 'tatti', 2);
    store.setCartItemQuantity('tatti-defined', 'tatti', 1);
    expect(useAppStore.getState()).toMatchObject({
      cartStoreId: 'tatti',
      cartItems: [
        { boxId: 'bakery-surprise', quantity: 2 },
        { boxId: 'tatti-defined', quantity: 1 },
      ],
    });
    useAppStore.getState().setCartItemQuantity('bakery-surprise', 'tatti', 0);
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'tatti-defined', quantity: 1 }]);
    useAppStore.getState().setCartItemQuantity('tatti-defined', 'tatti', 0);
    expect(useAppStore.getState()).toMatchObject({ cartStoreId: undefined, cartItems: [] });
  });

  it('creates separate orders and reduces the available mock stock', () => {
    useAppStore.getState().setCartItemQuantity('bakery-surprise', 'tatti', 2);
    useAppStore.getState().setCartItemQuantity('tatti-defined', 'tatti', 1);
    useAppStore.getState().completePurchase([
      { id: '12345678', boxId: 'bakery-surprise', quantity: 2, total: 4980, pickupCode: '1234', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid' },
      { id: '87654321', boxId: 'tatti-defined', quantity: 1, total: 2390, pickupCode: '5678', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid' },
    ]);
    expect(useAppStore.getState().orders.map((order) => order.id)).toEqual(['12345678', '87654321']);
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({ 'bakery-surprise': 2, 'tatti-defined': 1 });
    expect(useAppStore.getState()).toMatchObject({ cartStoreId: undefined, cartItems: [] });
  });

  it('never mixes boxes from different venues', () => {
    useAppStore.getState().setCartItemQuantity('bakery-surprise', 'tatti', 1);
    useAppStore.getState().setCartItemQuantity('coffee', 'kofi', 1);
    expect(useAppStore.getState()).toMatchObject({
      cartStoreId: 'kofi',
      cartItems: [{ boxId: 'coffee', quantity: 1 }],
    });
  });
});
