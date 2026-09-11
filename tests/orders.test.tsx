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
          pickupStartsAt: '2026-08-26T13:30:00.000Z', pickupEndsAt: '2026-08-26T15:30:00.000Z',
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
    expect(screen.getByText('Готов к получению')).toBeInTheDocument();
    expect(screen.getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Tatti-box')).toBeInTheDocument();
    expect(screen.getByText('Surprise Tatti-box').parentElement).toHaveTextContent(/2.?490 ₸ × 2/);
    expect(screen.getByText('Tatti-box').parentElement).toHaveTextContent(/2.?390 ₸ × 1/);
    expect(screen.getByText('Номер заказа: 12345678')).toBeInTheDocument();
    const pickupTime = screen.getByText('Время выдачи');
    expect(pickupTime).toBeInTheDocument();
    const activeCard = screen.getByText('Номер заказа: 12345678').closest('article');
    expect(activeCard).not.toBeNull();
    expect(within(activeCard!).getByTestId('active-order-pickup')).toHaveTextContent('18:30–20:30');
    expect(within(activeCard!).getByTestId('order-schedule')).toHaveTextContent('26 августа 2026 г.');
    expect(within(activeCard!).getByText('26 августа 2026 г.').parentElement?.querySelector('[data-icon="calendar"]')).toBeInTheDocument();
    expect(within(activeCard!).getByText('Итого')).toBeInTheDocument();
    expect(screen.getByText('26 августа 2026 г.')).toBeInTheDocument();
    expect(screen.queryByText(/Забрать:/)).not.toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 12345678').closest('button')).toBeNull();
    fireEvent.click(screen.getByText('Номер заказа: 12345678'));
    expect(screen.queryByTitle('QR-код')).not.toBeInTheDocument();
    const receiveOrderButton = screen.getByRole('button', { name: 'Получить заказ' });
    expect(receiveOrderButton).toHaveAccessibleName('Получить заказ');
    expect(receiveOrderButton).toBeInTheDocument();
    expect(screen.queryByText('Кофе & булочки')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 87654321')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    expect(screen.getByRole('button', { name: 'Прошедшие' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Получен').length).toBeGreaterThan(0);
    expect(screen.getByText('Кофе & булочки')).toBeInTheDocument();
    expect(screen.getByText('Номер заказа: 87654321')).toBeInTheDocument();
    expect(screen.getByText('Кофе & булочки').parentElement).toHaveTextContent(/1.?990 ₸ × 2/);
    const pastCard = screen.getByText('Номер заказа: 87654321').closest('article');
    expect(within(pastCard!).getByTestId('order-schedule')).toHaveTextContent('20 августа 2026 г.');
    expect(within(pastCard!).queryByRole('button', { name: 'Детали заказа' })).not.toBeInTheDocument();
    expect(screen.queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(screen.queryByText('Номер заказа: 12345678')).not.toBeInTheDocument();
  });

  it('opens a focused pickup window with only QR, instructions and code', async () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Получить заказ' }));
    await act(async () => { await vi.dynamicImportSettled(); });

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

  it('shows complete past order information without a details action', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    fireEvent.click(screen.getByRole('button', { name: 'Прошедшие' }));
    const completedCard = screen.getByText('Номер заказа: 87654321').closest('article');
    expect(completedCard).not.toBeNull();
    expect(within(completedCard!).getByText('Кофе & булочки')).not.toHaveClass('truncate');
    expect(within(completedCard!).getByText('Получен')).toBeInTheDocument();
    expect(within(completedCard!).getByText('20 августа 2026 г.')).toBeInTheDocument();
    expect(within(completedCard!).getByText('3 980 ₸')).toBeInTheDocument();
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

  it('cancels an eligible order, restores stock and opens past orders', () => {
    vi.setSystemTime('2026-08-25T10:00:00.000Z');
    useAppStore.setState((state) => ({
      orders: [{ ...state.orders[0]!, pickupStartsAt: '2026-08-25T14:30:00.000Z', pickupEndsAt: '2026-08-25T15:30:00.000Z' }],
      purchasedBoxQuantities: { 'bakery-surprise': 2, 'tatti-defined': 1 },
    }));
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));

    const cancelButton = screen.getByRole('button', { name: 'Отменить заказ' });
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);
    const confirmation = screen.getByRole('dialog', { name: 'Отменить заказ?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Оставить заказ' }));
    expect(screen.getByRole('button', { name: 'Активные' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Отменить заказ' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Отменить заказ?' })).getByRole('button', { name: 'Отменить заказ' }));

    expect(screen.getByRole('button', { name: 'Прошедшие' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Отменён')).toBeInTheDocument();
    expect(useAppStore.getState().orders[0]?.status).toBe('cancelled');
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({});

    const cancelledCard = screen.getByText('Номер заказа: 12345678').closest('article');
    expect(within(cancelledCard!).getByText('Отменён')).toBeInTheDocument();
    expect(within(cancelledCard!).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTitle('QR-код')).not.toBeInTheDocument();
    expect(screen.queryByText('123-456')).not.toBeInTheDocument();
  });

  it('keeps cancellation disabled inside the three-hour cutoff', () => {
    vi.setSystemTime('2026-08-25T12:00:00.001Z');
    useAppStore.setState((state) => ({
      orders: [{ ...state.orders[0]!, pickupStartsAt: '2026-08-25T14:30:00.000Z', pickupEndsAt: '2026-08-25T15:30:00.000Z' }],
    }));
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));

    expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeDisabled();
    expect(screen.getByText('Отмена недоступна менее чем за 3 часа до начала выдачи.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Отменить заказ?' })).not.toBeInTheDocument();
  });

  it('disables cancellation automatically when the cutoff passes', () => {
    vi.setSystemTime('2026-08-25T11:29:58.000Z');
    useAppStore.setState((state) => ({
      orders: [{ ...state.orders[0]!, pickupStartsAt: '2026-08-25T14:30:00.000Z', pickupEndsAt: '2026-08-25T15:30:00.000Z' }],
    }));
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeEnabled();

    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeDisabled();
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
    expect(screen.queryByRole('button', { name: 'Детали заказа' })).not.toBeInTheDocument();
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
    expect(within(navigation).getAllByRole('button').map((button) => button.lastElementChild?.textContent)).toEqual(['Главная', 'Заказы', 'Избранное', 'Профиль']);
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
    expect(within(navigation).getAllByRole('button').map((button) => button.lastElementChild?.textContent)).toEqual(['Басты бет', 'Тапсырыстар', 'Таңдаулылар', 'Профиль']);
    expect(within(navigation).getByRole('button', { name: 'Таңдаулылар' })).toHaveTextContent('Таңдаулылар');
    expect(within(navigation).getByRole('button', { name: 'Тапсырыстар' })).toHaveTextContent('Тапсырыстар');
    fireEvent.click(within(navigation).getByRole('button', { name: 'Тапсырыстар' }));
    expect(screen.getByRole('heading', { name: 'Тапсырыстар' })).toBeInTheDocument();
    expect(screen.getByText('26 тамыз 2026 ж.')).toBeInTheDocument();
  });
});
