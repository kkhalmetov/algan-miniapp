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
});
