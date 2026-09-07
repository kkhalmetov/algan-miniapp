import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('orders tab', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      legalAcceptance: acceptedLegalDocuments,
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      locale: 'ru',
      tab: 'home',
      favoriteBoxIds: [],
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

    expect(screen.getAllByRole('main')).toHaveLength(1);
    const main = screen.getByRole('main');
    main.scrollTop = 240;
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(main.scrollTop).toBe(0);
    expect(screen.getByRole('heading', { name: 'Заказы' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Активные' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Готов к получению')).not.toBeInTheDocument();
    expect(screen.getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Surprise Tatti-box').parentElement).toHaveTextContent(/2.?490 ₸ × 2/);
    expect(screen.getByText('Tatti-box').parentElement).toHaveTextContent(/2.?390 ₸ × 1/);
    expect(screen.getByText('Номер заказа: 12345678')).toBeInTheDocument();
    const pickupTime = screen.getByText(/Заберите сегодня ·/);
    expect(pickupTime).toBeInTheDocument();
    const activeCard = screen.getByText('Номер заказа: 12345678').closest('article');
    expect(activeCard).not.toBeNull();
    expect(within(activeCard!).getByTestId('active-order-pickup')).toHaveTextContent('Заберите сегодня · 18:30–20:30');
    expect(within(activeCard!).getByText('25 августа 2026 г.').parentElement?.querySelector('.lucide-calendar-days')).toBeInTheDocument();
    expect(within(activeCard!).getByText('Итого')).toBeInTheDocument();
    expect(screen.getByText('25 августа 2026 г.')).toBeInTheDocument();
    expect(screen.queryByText(/Забрать:/)).not.toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 12345678').closest('button')).toBeNull();
    fireEvent.click(screen.getByText('Номер заказа: 12345678'));
    expect(screen.queryByTitle('QR-код')).not.toBeInTheDocument();
    const receiveOrderButton = screen.getByRole('button', { name: 'Получить заказ' });
    expect(receiveOrderButton.querySelector('svg')).not.toBeInTheDocument();
    expect(receiveOrderButton).toBeInTheDocument();
    expect(screen.queryByText('Кофе & булочки')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 87654321')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    expect(screen.getByRole('button', { name: 'Прошедшие' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Получен')).not.toBeInTheDocument();
    expect(screen.getByText('Кофе & булочки')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 87654321')).toBeInTheDocument();
    expect(screen.getByText('Кофе & булочки').parentElement).toHaveTextContent(/1.?990 ₸ × 2/);
    expect(screen.queryByRole('button', { name: 'Подробнее' })).not.toBeInTheDocument();
    expect(screen.queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 12345678')).not.toBeInTheDocument();
  });

  it('opens a focused pickup window with only QR, instructions and code', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Получить заказ' }));

    const dialog = screen.getByRole('dialog', { name: 'Получить заказ' });
    expect(within(dialog).getByTitle('QR-код')).toBeInTheDocument();
    expect(within(dialog).getByText('123-456')).toBeInTheDocument();
    expect(within(dialog).getByText('Покажите QR-код или код получения сотруднику заведения при получении заказа.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('heading', { name: 'QR-код' })).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Номер заказа: 12345678')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tatti Bakery')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('heading', { name: 'Состав заказа' })).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Итого')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tatti-box')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Построить маршрут' })).not.toBeInTheDocument();
  });

  it('keeps completed orders informational without a details action', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    const completedCard = screen.getByText('Номер заказа: 87654321').closest('article');
    expect(completedCard).not.toBeNull();
    expect(within(completedCard!).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Детали заказа' })).not.toBeInTheDocument();
  });

  it('opens route providers from an active order card', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    const buildRouteButton = screen.getByRole('button', { name: 'Построить маршрут' });
    expect(buildRouteButton.querySelector('svg')).not.toBeInTheDocument();
    fireEvent.click(buildRouteButton);

    const dialog = screen.getByRole('dialog', { name: 'Выберите карту' });
    expect(dialog.querySelector('[data-dialog-variant] > div')).toHaveClass('px-page', 'sm:px-page-wide');
    expect(within(dialog).getByText('2GIS')).toBeInTheDocument();
    expect(within(dialog).getByText('Яндекс Карты')).toBeInTheDocument();
    expect(within(dialog).getByText('Google Maps')).toBeInTheDocument();
    expect(within(dialog).queryByText('Маршрут откроется в выбранном приложении.')).not.toBeInTheDocument();
    expect(within(dialog).getAllByText('Открыть')).toHaveLength(4);
    expect(within(dialog).queryByTitle('QR-код')).not.toBeInTheDocument();
  });

  it('shows a demo card when the user has no past orders yet', () => {
    useAppStore.setState({ orders: [] });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));

    expect(screen.getByText('Bal Dessert')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 48273106')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 48273106').closest('button')).toBeNull();
    expect(screen.getByText('Сладкий вечер')).toBeInTheDocument();
    expect(screen.getByText('Сладкий вечер').parentElement).toHaveTextContent(/3.?190 ₸ × 1/);
    expect(screen.queryByRole('button', { name: 'Подробнее' })).not.toBeInTheDocument();
  });

  it('offers a way back to the catalog from an empty active state', () => {
    useAppStore.setState({ orders: [] });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(screen.getByText('У вас пока нет активных заказов')).toBeInTheDocument();
    const browseButton = screen.getByRole('button', { name: 'Найти предложения' });
    expect(browseButton.querySelector('svg')).not.toBeInTheDocument();
    fireEvent.click(browseButton);
    expect(screen.getByRole('button', { name: 'Подробнее: Surprise Tatti-box, Tatti Bakery' })).toBeInTheDocument();
  });

  it('does not show the orders block in profile', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const navigation = screen.getByRole('navigation');
    expect(within(navigation).queryByRole('button', { name: 'Карта' })).not.toBeInTheDocument();
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual(['Главная', 'Заказы', 'Избранное', 'Профиль']);
    fireEvent.click(within(navigation).getByRole('button', { name: 'Профиль' }));
    expect(screen.getByRole('heading', { name: 'Kimal' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Заказы' })).not.toBeInTheDocument();
    expect(screen.queryByText('У вас пока нет заказов')).not.toBeInTheDocument();
  });

  it('shows complete kazakh labels in the compact navigation', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const navigation = screen.getByRole('navigation');
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual(['Басты бет', 'Тапсырыстар', 'Таңдаулылар', 'Профиль']);
    expect(within(navigation).getByRole('button', { name: 'Таңдаулылар' })).toHaveTextContent('Таңдаулылар');
    expect(within(navigation).getByRole('button', { name: 'Тапсырыстар' })).toHaveTextContent('Тапсырыстар');
    fireEvent.click(within(navigation).getByRole('button', { name: 'Тапсырыстар' }));
    expect(screen.getByRole('heading', { name: 'Тапсырыстар' })).toBeInTheDocument();
    expect(screen.getByText('25 тамыз 2026 ж.')).toBeInTheDocument();
  });
});
