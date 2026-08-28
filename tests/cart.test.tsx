import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('multi-box cart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    window.history.replaceState({}, '', '/');
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

  it('adds different box types and creates one grouped order', async () => {
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
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });

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

  it('keeps the cart after a failed payment and creates the order after returning to checkout', async () => {
    window.history.replaceState({}, '', '/?mockPayment=failed');
    openTatti();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Surprise Tatti-box' }));
    fireEvent.click(screen.getByRole('button', { name: /Корзина · 1/ }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });

    const failureDialog = screen.getByRole('dialog', { name: 'Оплата не прошла' });
    expect(within(failureDialog).getByText('Не удалось завершить оплату. Попробуйте ещё раз или вернитесь в корзину.')).toBeInTheDocument();
    expect(within(failureDialog).queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument();
    expect(within(failureDialog).queryByRole('button', { name: 'Повторить оплату' })).not.toBeInTheDocument();
    expect(useAppStore.getState().orders).toEqual([]);
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({});
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);
    expect(window.location.search).toBe('');

    fireEvent.click(within(failureDialog).getByRole('button', { name: 'Вернуться в корзину' }));
    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    await act(async () => {
      fireEvent.click(within(cartDialog).getByRole('button', { name: /Оформить заказ/ }));
    });

    expect(screen.getByText('Заказ оформлен!')).toBeInTheDocument();
    expect(useAppStore.getState().orders).toHaveLength(1);
    expect(useAppStore.getState().cartItems).toEqual([]);
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({ 'bakery-surprise': 1 });
  });

  it('returns from a failed payment to the preserved cart', async () => {
    window.history.replaceState({}, '', '/?mockPayment=failed');
    openTatti();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Surprise Tatti-box' }));
    fireEvent.click(screen.getByRole('button', { name: /Корзина · 1/ }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться в корзину' }));

    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    expect(within(cartDialog).getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);

  });

  it('does not allow selecting more boxes than are available', () => {
    openTatti();
    const familyCard = screen.getByText('Семейный Tatti-box').closest('article');
    expect(familyCard).not.toBeNull();
    fireEvent.click(within(familyCard!).getByRole('button', { name: 'Добавить Семейный Tatti-box' }));
    expect(within(familyCard!).getByRole('button', { name: 'Количество +' })).toBeDisabled();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'tatti-family', quantity: 1 }]);
  });

  it('links the checkout consent to the public offer and order rules mocks', () => {
    openTatti();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить Surprise Tatti-box' }));
    fireEvent.click(screen.getByRole('button', { name: /Корзина · 1/ }));

    expect(screen.getByText(/Оформляя заказ, вы подтверждаете свое согласие с условиями/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'публичной оферты' }));

    const offer = screen.getByRole('dialog', { name: 'Публичная оферта' });
    expect(within(offer).getByText(/Документ готовится/)).toBeInTheDocument();
    fireEvent.click(within(offer).getByRole('button', { name: 'Закрыть' }));

    fireEvent.click(screen.getByRole('button', { name: 'правилами заказа, оплаты, самовывоза, отмены и возврата' }));
    const rules = screen.getByRole('dialog', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' });
    expect(within(rules).getByText(/Документ готовится/)).toBeInTheDocument();
  });

  it('asks before replacing a cart from another venue', () => {
    useAppStore.setState({ cartStoreId: 'tatti', cartItems: [{ boxId: 'bakery-surprise', quantity: 1 }] });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Köfi ул\. Байтурсынова, 12/ }));
    const confirmation = screen.getByRole('dialog', { name: 'Корзина' });
    expect(within(confirmation).getByText('В корзине есть боксы другого заведения. Очистить корзину и перейти?')).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByRole('dialog', { name: 'Köfi' })).not.toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);

    fireEvent.click(screen.getByRole('button', { name: /Köfi ул\. Байтурсынова, 12/ }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Корзина' })).getByRole('button', { name: 'Очистить корзину' }));
    expect(screen.getByRole('dialog', { name: 'Köfi' })).toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([]);
  });
});
