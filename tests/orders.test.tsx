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
    expect(screen.getByText('Номер заказа: 12345678').closest('button')).toBeNull();
    fireEvent.click(screen.getByText('Номер заказа: 12345678'));
    expect(screen.queryByTitle('QR-код')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Получить заказ' })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: 'Получить заказ' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByTitle('QR-код')).toBeInTheDocument();
    expect(within(dialog).getByText('123-456')).toBeInTheDocument();
    expect(within(dialog).queryByRole('heading', { name: 'QR-код' })).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Номер заказа: 12345678')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tatti Bakery')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Состав заказа')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Итого')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Забрать:/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tatti-box')).not.toBeInTheDocument();
  });

  it('opens route providers from an active order card', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Построить маршрут' }));

    const dialog = screen.getByRole('dialog', { name: 'Выберите карту' });
    expect(within(dialog).getByText('2GIS')).toBeInTheDocument();
    expect(within(dialog).getByText('Яндекс Карты')).toBeInTheDocument();
    expect(within(dialog).getByText('Google Maps')).toBeInTheDocument();
    expect(within(dialog).queryByTitle('QR-код')).not.toBeInTheDocument();
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

  it('shows complete kazakh labels in the compact navigation', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const navigation = screen.getByRole('navigation');
    expect(within(navigation).getByRole('button', { name: 'Таңдаулылар' })).toHaveTextContent('Таңдаулылар');
    expect(within(navigation).getByRole('button', { name: 'Тапсырыстар' })).toHaveTextContent('Тапсырыстар');
  });
});
