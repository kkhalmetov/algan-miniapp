import { beforeEach, describe, expect, it } from 'vitest';
import { migratePersistedState, useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('local MVP state', () => {
  beforeEach(() => {
    useAppStore.setState({
      onboardingDone: false,
      legalAcceptance: undefined,
      profile: { firstName: '' },
      locale: 'ru',
      currency: 'KZT',
      tab: 'home',
      favoriteBoxIds: [],
      orders: [],
      cartStoreId: undefined,
      cartItems: [],
      purchasedBoxQuantities: {},
    });
  });

  it('uses Kazakh as the default language for a new user', () => {
    expect(useAppStore.getInitialState().locale).toBe('kk');
  });

  it('uses tenge by default and saves the selected display currency', () => {
    expect(useAppStore.getInitialState().currency).toBe('KZT');
    useAppStore.getState().setCurrency('RUB');
    expect(useAppStore.getState().currency).toBe('RUB');
  });

  it('completes onboarding and saves an optional profile', () => {
    useAppStore.getState().completeOnboarding({ firstName: 'Алия' }, acceptedLegalDocuments);
    expect(useAppStore.getState().onboardingDone).toBe(true);
    expect(useAppStore.getState().profile).toEqual({ firstName: 'Алия' });
    expect(useAppStore.getState().legalAcceptance).toEqual(acceptedLegalDocuments);
  });

  it('saves a renewed legal acceptance without changing user data', () => {
    useAppStore.setState({
      onboardingDone: true,
      profile: { firstName: 'Алия', phone: '+77059768000' },
      favoriteBoxIds: ['bakery-surprise'],
      legalAcceptance: undefined,
    });
    useAppStore.getState().acceptLegalDocuments(acceptedLegalDocuments);

    expect(useAppStore.getState()).toMatchObject({
      onboardingDone: true,
      profile: { firstName: 'Алия', phone: '+77059768000' },
      favoriteBoxIds: ['bakery-surprise'],
      legalAcceptance: acceptedLegalDocuments,
    });
  });

  it('toggles boxes in favorites without duplicates', () => {
    useAppStore.getState().toggleFavoriteBox('bakery-surprise');
    useAppStore.getState().toggleFavoriteBox('bakery-surprise');
    expect(useAppStore.getState().favoriteBoxIds).toEqual([]);
  });

  it('syncs Telegram identity without removing the saved phone', () => {
    useAppStore.setState({ profile: { firstName: 'Пользователь', phone: '+77001234567' } });
    useAppStore.getState().syncTelegramProfile({ telegramId: 123, firstName: 'Kimal', lastName: 'A', photoUrl: 'https://example.test/avatar.jpg' });
    expect(useAppStore.getState().profile).toEqual({
      telegramId: 123, firstName: 'Kimal', lastName: 'A', phone: '+77001234567', photoUrl: 'https://example.test/avatar.jpg',
    });
  });

  it('skips redundant Telegram profile updates', () => {
    useAppStore.setState({ profile: { telegramId: 123, firstName: 'Kimal', lastName: 'A', phone: '+77001234567' } });
    const stateBeforeSync = useAppStore.getState();

    useAppStore.getState().syncTelegramProfile({ telegramId: 123, firstName: 'Kimal', lastName: 'A', photoUrl: undefined });

    expect(useAppStore.getState()).toBe(stateBeforeSync);
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
      id: 'order-1', storeId: 'tatti', items: [{ boxId: 'bakery-surprise', quantity: 1, unitPrice: 2490 }], total: 2490,
      pickupCode: '123456', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid',
    });
    expect(useAppStore.getState().orders[0]?.pickupCode).toBe('123456');
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

  it('creates one grouped order and reduces the available mock stock', () => {
    useAppStore.getState().setCartItemQuantity('bakery-surprise', 'tatti', 2);
    useAppStore.getState().setCartItemQuantity('tatti-defined', 'tatti', 1);
    useAppStore.getState().completePurchase({
      id: '12345678', storeId: 'tatti', items: [
        { boxId: 'bakery-surprise', quantity: 2, unitPrice: 2490 },
        { boxId: 'tatti-defined', quantity: 1, unitPrice: 2390 },
      ], total: 7370, pickupCode: '123456', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid',
    });
    expect(useAppStore.getState().orders.map((order) => order.id)).toEqual(['12345678']);
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

  it('migrates legacy one-box orders without dropping history', () => {
    const migrated = migratePersistedState({
      orders: [{ id: '12345678', boxId: 'bakery-surprise', quantity: 2, total: 4980, pickupCode: '1234', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid' }],
    }) as { orders: Array<{ storeId: string; pickupCode: string; items: unknown[] }> };
    expect(migrated.orders[0]).toMatchObject({ storeId: 'tatti', pickupCode: '001234' });
    expect(migrated.orders[0]?.items).toEqual([{ boxId: 'bakery-surprise', quantity: 2, unitPrice: 2490 }]);
  });

  it('migrates favorite venues to every existing box from those venues', () => {
    const migrated = migratePersistedState({
      favoriteStoreIds: ['tatti', 'missing-store'],
      orders: [],
    }) as { favoriteBoxIds: string[] };

    expect(migrated.favoriteBoxIds).toEqual([
      'bakery-surprise',
      'tatti-defined',
      'tatti-morning',
      'tatti-family',
      'tatti-evening-surprise',
    ]);
  });

  it('removes the retired map location from persisted state', () => {
    const migrated = migratePersistedState({
      location: { lat: 42.3184, lng: 69.5907, address: 'Шымкент' },
      orders: [],
    }) as Record<string, unknown>;

    expect(migrated).not.toHaveProperty('location');
  });
});
