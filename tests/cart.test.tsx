import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('multi-box cart', () => {
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
      orders: [],
      cartStoreId: undefined,
      cartItems: [],
      purchasedBoxQuantities: {},
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const openTatti = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Tatti Bakery пр\. Тауке хана, 47/ }));
  };

  it('adds different box types and creates one grouped order', () => {
    openTatti();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Surprise Tatti-box' }));
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Tatti-box' }));

    expect(useAppStore.getState().cartItems).toEqual([
      { boxId: 'bakery-surprise', quantity: 1 },
      { boxId: 'tatti-defined', quantity: 1 },
    ]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Количество +' })[0]!);
    expect(useAppStore.getState().cartItems[0]).toEqual({ boxId: 'bakery-surprise', quantity: 2 });

    fireEvent.click(screen.getByRole('button', { name: /Корзина · 3/ }));
    expect(screen.getByText('Корзина')).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.replace(/\s/g, '') === '7370₸').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));

    expect(screen.getByText('Заказ оформлен!')).toBeInTheDocument();
    expect(screen.getByText('Покажите QR-код или код получения сотруднику заведения при получении заказа.')).toBeInTheDocument();
    const successDialog = screen.getByRole('dialog');
    expect(within(successDialog).queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(within(successDialog).queryByText('Tatti-box')).not.toBeInTheDocument();
    const orders = useAppStore.getState().orders;
    expect(orders).toHaveLength(1);
    expect(orders[0]?.items).toEqual([
      { boxId: 'bakery-surprise', quantity: 2, unitPrice: 2490 },
      { boxId: 'tatti-defined', quantity: 1, unitPrice: 2390 },
    ]);
    expect(orders[0]?.id).toMatch(/^\d{8}$/);
    expect(orders[0]?.pickupCode).toMatch(/^\d{6}$/);
    expect(screen.getByText(/^\d{3}-\d{3}$/)).toBeInTheDocument();
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({ 'bakery-surprise': 2, 'tatti-defined': 1 });
    expect(useAppStore.getState().cartItems).toEqual([]);
  });

  it('does not allow selecting more boxes than are available', () => {
    openTatti();
    const familyCard = screen.getByText('Семейный Tatti-box').closest('article');
    expect(familyCard).not.toBeNull();
    fireEvent.click(within(familyCard!).getByRole('button', { name: 'Добавить Семейный Tatti-box' }));
    expect(within(familyCard!).getByRole('button', { name: 'Количество +' })).toBeDisabled();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'tatti-family', quantity: 1 }]);
  });

  it('links the checkout consent to the public offer mock', () => {
    openTatti();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Surprise Tatti-box' }));
    fireEvent.click(screen.getByRole('button', { name: /Корзина · 1/ }));

    expect(screen.getByText(/Оформляя заказ, вы автоматически принимаете условия/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'публичной оферты' }));

    const offer = screen.getByRole('dialog', { name: 'Публичная оферта' });
    expect(within(offer).getByText(/Документ готовится/)).toBeInTheDocument();
  });

  it('asks before replacing a cart from another venue', () => {
    useAppStore.setState({ cartStoreId: 'tatti', cartItems: [{ boxId: 'bakery-surprise', quantity: 1 }] });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Köfi ул\. Байтурсынова, 12/ }));
    const confirmation = screen.getByRole('dialog', { name: 'Algan' });
    expect(within(confirmation).getByText('В корзине есть боксы другого заведения. Очистить корзину и перейти?')).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('dialog', { name: 'Köfi' })).not.toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);

    fireEvent.click(screen.getByRole('button', { name: /Köfi ул\. Байтурсынова, 12/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Algan' })).getByRole('button', { name: 'Очистить корзину' }));
    expect(screen.getByRole('dialog', { name: 'Köfi' })).toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([]);
  });
});
