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

  it('adds paid demo orders to the top of history', () => {
    useAppStore.getState().addOrder({
      id: 'order-1', boxId: 'bakery-surprise', quantity: 1, total: 2490,
      pickupCode: '1234', createdAt: '2026-08-25T00:00:00.000Z', status: 'paid',
    });
    expect(useAppStore.getState().orders[0]?.pickupCode).toBe('1234');
  });
});
