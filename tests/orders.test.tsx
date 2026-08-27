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
          id: '12345678', storeId: 'tatti', items: [
            { boxId: 'bakery-surprise', quantity: 2, unitPrice: 2490 },
            { boxId: 'tatti-defined', quantity: 1, unitPrice: 2390 },
          ], total: 7370,
          pickupCode: '123456', createdAt: '2026-08-25T10:00:00.000Z', status: 'paid',
        },
        {
          id: '87654321', storeId: 'kofi', items: [{ boxId: 'coffee-pair', quantity: 2, unitPrice: 1990 }], total: 3980,
          pickupCode: '567890', createdAt: '2026-08-20T10:00:00.000Z', status: 'collected',
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
    expect(screen.getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 12345678')).toBeInTheDocument();
    expect(screen.getByText('Показать QR-код')).toBeInTheDocument();
    expect(screen.queryByText('Кофе & булочки')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 87654321')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    expect(screen.getByRole('button', { name: 'Прошедшие' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Кофе & булочки')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 87654321')).toBeInTheDocument();
    expect(screen.queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 12345678')).not.toBeInTheDocument();
  });

  it('opens one active order with QR, one code and all purchased boxes', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByText('Номер заказа: 12345678').closest('button')!);

    expect(screen.getByTitle('QR-код')).toBeInTheDocument();
    expect(screen.getByText('123-456')).toBeInTheDocument();
    expect(screen.getAllByText('Surprise Tatti-box').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tatti-box').length).toBeGreaterThan(0);
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
