import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('orders tab', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      locale: 'ru',
      tab: 'home',
      favoriteStoreIds: [],
      orders: [
        {
          id: 'active-order', boxId: 'bakery-surprise', quantity: 1, total: 2490,
          pickupCode: '1234', createdAt: '2026-08-25T10:00:00.000Z', status: 'paid',
        },
        {
          id: 'past-order', boxId: 'coffee-pair', quantity: 2, total: 2980,
          pickupCode: '5678', createdAt: '2026-08-20T10:00:00.000Z', status: 'collected',
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('separates active and past orders in a dedicated navigation tab', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(screen.getByRole('heading', { name: 'Заказы' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Активные' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Большой bakery box')).toBeInTheDocument();
    expect(screen.queryByText('Кофе & булочки')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    expect(screen.getByRole('button', { name: 'Прошедшие' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Кофе & булочки')).toBeInTheDocument();
    expect(screen.queryByText('Большой bakery box')).not.toBeInTheDocument();
  });

  it('does not show the orders block in profile', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    expect(within(screen.getByRole('navigation')).queryByRole('button', { name: 'Профиль' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Профиль' }));
    expect(screen.getByRole('heading', { name: 'Kimal' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Заказы' })).not.toBeInTheDocument();
    expect(screen.queryByText('У вас пока нет заказов')).not.toBeInTheDocument();
  });
});
