import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('multi-box cart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    window.history.replaceState({}, '', '/');
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      legalAcceptance: acceptedLegalDocuments,
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      locale: 'ru',
      tab: 'home',
      favoriteBoxIds: [],
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

  const openCatalog = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
  };

  const addBoxFromDetails = (name: string, quantity = 1) => {
    fireEvent.click(screen.getByRole('button', { name: `Подробнее: ${name}, Tatti Bakery` }));
    const dialog = screen.getByRole('dialog', { name });
    for (let index = 1; index < quantity; index += 1) {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Количество +' }));
    }
    fireEvent.click(within(dialog).getByRole('button', { name: `Добавить в корзину ${name}` }));
  };

  it('keeps the cart accessible from every navigation tab', () => {
    useAppStore.setState({ cartStoreId: 'tatti', cartItems: [{ boxId: 'bakery-surprise', quantity: 1 }] });
    openCatalog();

    expect(screen.getByTestId('cart-dock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Заказы' }));
    expect(screen.getByTestId('cart-dock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Избранное' }));
    expect(screen.getByTestId('cart-dock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Профиль' }));
    expect(screen.getByTestId('cart-dock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Главная' }));
    expect(screen.getByTestId('cart-dock')).toBeInTheDocument();
  });

  it('adds different box types and creates one grouped order', async () => {
    openCatalog();
    addBoxFromDetails('Surprise Tatti-box', 2);
    addBoxFromDetails('Tatti-box');

    expect(useAppStore.getState().cartItems).toEqual([
      { boxId: 'bakery-surprise', quantity: 2 },
      { boxId: 'tatti-defined', quantity: 1 },
    ]);
    const cartButton = screen.getByRole('button', { name: /^Корзина/ });
    expect(within(cartButton).getByText('3')).toBeInTheDocument();
    expect(cartButton).toHaveAccessibleName(/^Корзина/);
    fireEvent.click(cartButton);
    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    expect(within(cartDialog).getByRole('heading', { name: 'Корзина' })).toBeInTheDocument();
    expect(within(cartDialog).getByText('19:30–20:30')).toBeInTheDocument();
    expect(within(cartDialog).getByText('18:30–19:30')).toBeInTheDocument();
    expect(within(cartDialog).getAllByText('Tatti Bakery')).toHaveLength(1);
    expect(within(cartDialog).getByTestId('cart-scroll')).not.toContainElement(within(cartDialog).getByTestId('cart-checkout-footer'));
    expect(within(cartDialog).getByTestId('cart-scroll')).toHaveClass('overflow-y-auto', 'overscroll-contain');
    expect(within(cartDialog).queryByRole('img')).not.toBeInTheDocument();
    expect(within(cartDialog).getByText('Заказ можно отменить не позднее чем за 3 часа до начала выдачи.')).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.replace(/\s/g, '') === '7370₸').length).toBeGreaterThan(0);
    await act(async () => {
      const checkoutButton = screen.getByRole('button', { name: 'Оформить заказ' });
      expect(checkoutButton.querySelector('svg')).not.toBeInTheDocument();
      fireEvent.click(checkoutButton);
    });

    expect(screen.getByText('Оплата прошла!')).toBeInTheDocument();
    expect(screen.getByText('Оплата прошла!').closest('.algan-full-screen')).toHaveClass('h-full', 'bg-canvas');
    const viewOrderButton = screen.getByRole('button', { name: 'Посмотреть заказ' });
    expect(viewOrderButton.querySelector('svg')).not.toBeInTheDocument();
    expect(viewOrderButton).toHaveClass('max-w-[330px]');
    expect(screen.getByText('Заказ оформлен. Все подробности и код получения доступны в разделе «Заказы».')).toBeInTheDocument();
    const successDialog = screen.getByRole('dialog');
    expect(successDialog.querySelector('[data-icon="success"]')).toBeInTheDocument();
    expect(within(successDialog).queryByTitle('QR-код')).not.toBeInTheDocument();
    expect(within(successDialog).queryByText('Код получения')).not.toBeInTheDocument();
    expect(within(successDialog).queryByText(/Номер заказа/)).not.toBeInTheDocument();
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
    expect(screen.queryByText(/^\d{3}-\d{3}$/)).not.toBeInTheDocument();
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({ 'bakery-surprise': 2, 'tatti-defined': 1 });
    expect(useAppStore.getState().cartItems).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Посмотреть заказ' }));
    expect(screen.getByRole('heading', { name: 'Заказы' })).toBeInTheDocument();
    expect(screen.getByText('Готов к получению')).toBeInTheDocument();
  });

  it('keeps the cart after a failed payment and creates the order after returning to checkout', async () => {
    window.history.replaceState({}, '', '/?mockPayment=failed');
    openCatalog();
    addBoxFromDetails('Surprise Tatti-box');
    fireEvent.click(screen.getByRole('button', { name: /^Корзина/ }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });

    const failureDialog = screen.getByRole('dialog', { name: 'Оплата не прошла' });
    expect(within(failureDialog).getByText('Не удалось завершить оплату. Попробуйте ещё раз.')).toBeInTheDocument();
    expect(within(failureDialog).getByText('Корзина сохранена')).toBeInTheDocument();
    expect(within(failureDialog).getByText(/Все выбранные боксы остались на месте/)).toBeInTheDocument();
    expect(within(failureDialog).getByText('Оплата не прошла').closest('.algan-full-screen')).toHaveClass('h-full', 'bg-accent-soft');
    expect(failureDialog.querySelector('[data-icon="warning"]')).toBeInTheDocument();
    expect([...failureDialog.querySelectorAll('*')].some((element) => element.classList.contains('bg-danger-soft/30'))).toBe(false);
    expect(within(failureDialog).queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument();
    expect(within(failureDialog).queryByRole('button', { name: 'Повторить оплату' })).not.toBeInTheDocument();
    expect(useAppStore.getState().orders).toEqual([]);
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({});
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);
    expect(window.location.search).toBe('');

    const backToCart = within(failureDialog).getByRole('button', { name: 'Вернуться в корзину' });
    expect(backToCart.querySelector('svg')).not.toBeInTheDocument();
    expect(backToCart).toHaveClass('max-w-[330px]', 'shrink-0');
    fireEvent.click(backToCart);
    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    await act(async () => {
      fireEvent.click(within(cartDialog).getByRole('button', { name: /Оформить заказ/ }));
    });

    expect(screen.getByText('Оплата прошла!')).toBeInTheDocument();
    expect(useAppStore.getState().orders).toHaveLength(1);
    expect(useAppStore.getState().cartItems).toEqual([]);
    expect(useAppStore.getState().purchasedBoxQuantities).toEqual({ 'bakery-surprise': 1 });
  });

  it('returns from a failed payment to the preserved cart', async () => {
    window.history.replaceState({}, '', '/?mockPayment=failed');
    openCatalog();
    addBoxFromDetails('Surprise Tatti-box');
    fireEvent.click(screen.getByRole('button', { name: /^Корзина/ }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Оформить заказ/ }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться в корзину' }));

    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    expect(within(cartDialog).getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);

  });

  it('shows only the empty state after the last cart item is removed', () => {
    openCatalog();
    addBoxFromDetails('Surprise Tatti-box');
    fireEvent.click(screen.getByRole('button', { name: /^Корзина/ }));

    const cartDialog = screen.getByRole('dialog', { name: 'Корзина' });
    fireEvent.click(within(cartDialog).getByRole('button', { name: 'Удалить: Surprise Tatti-box' }));

    expect(within(cartDialog).getByText('Корзина пуста')).toBeInTheDocument();
    expect(within(cartDialog).queryByText('Отмена заказа')).not.toBeInTheDocument();
    expect(within(cartDialog).queryByText('Итого')).not.toBeInTheDocument();
    expect(within(cartDialog).queryByRole('button', { name: 'Оформить заказ' })).not.toBeInTheDocument();
    expect(within(cartDialog).queryByRole('button', { name: 'публичную оферту' })).not.toBeInTheDocument();
  });

  it('does not allow selecting more boxes than are available', () => {
    openCatalog();
    const familyCard = screen.getByText('Семейный Tatti-box').closest('article');
    expect(familyCard).not.toBeNull();
    fireEvent.click(within(familyCard!).getByRole('button', { name: 'Подробнее: Семейный Tatti-box, Tatti Bakery' }));
    const familyDialog = screen.getByRole('dialog', { name: 'Семейный Tatti-box' });
    expect(within(familyDialog).getByRole('button', { name: 'Количество +' })).toBeDisabled();
    fireEvent.click(within(familyDialog).getByRole('button', { name: 'Добавить в корзину Семейный Tatti-box' }));
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'tatti-family', quantity: 1 }]);
  });

  it('links the checkout consent to the public offer and order rules mocks', () => {
    openCatalog();
    addBoxFromDetails('Surprise Tatti-box');
    fireEvent.click(screen.getByRole('button', { name: /^Корзина/ }));

    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Нажимая «Оформить заказ», вы автоматически принимаете публичную оферту и правила заказа, оплаты, самовывоза, отмены и возврата')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'публичную оферту' }));

    const offer = screen.getByRole('dialog', { name: 'Публичная оферта' });
    expect(within(offer).getByText(/Документ готовится/)).toBeInTheDocument();
    fireEvent.click(within(offer).getByRole('button', { name: 'Закрыть' }));

    fireEvent.click(screen.getByRole('button', { name: 'правила заказа, оплаты, самовывоза, отмены и возврата' }));
    const rules = screen.getByRole('dialog', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' });
    expect(within(rules).getByText(/Документ готовится/)).toBeInTheDocument();
  });

  it('asks before replacing a cart from another venue', () => {
    useAppStore.setState({ cartStoreId: 'tatti', cartItems: [{ boxId: 'bakery-surprise', quantity: 1 }] });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее: Кофе & булочки, Köfi' }));
    const boxDialog = screen.getByRole('dialog', { name: 'Кофе & булочки' });
    fireEvent.click(within(boxDialog).getByRole('button', { name: 'Добавить в корзину Кофе & булочки' }));
    const confirmation = screen.getByRole('dialog', { name: 'Заменить корзину?' });
    expect(within(confirmation).getByText('В одной корзине могут быть боксы только одного заведения.')).toBeInTheDocument();
    expect(within(confirmation).getByRole('button', { name: 'Очистить и добавить' })).toHaveClass('bg-warning-ink', 'text-white');
    expect(within(confirmation).getByText('Текущие боксы будут удалены, а выбранный бокс добавится в новую корзину.')).toBeInTheDocument();
    expect(within(confirmation).queryByRole('button', { name: 'Закрыть' })).not.toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Оставить корзину' }));
    expect(screen.queryByRole('dialog', { name: 'Кофе & булочки' })).not.toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 1 }]);

    fireEvent.click(screen.getByRole('button', { name: 'Подробнее: Кофе & булочки, Köfi' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Кофе & булочки' })).getByRole('button', { name: 'Добавить в корзину Кофе & булочки' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Заменить корзину?' })).getByRole('button', { name: 'Очистить и добавить' }));
    expect(screen.queryByRole('dialog', { name: 'Кофе & булочки' })).not.toBeInTheDocument();
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'coffee-pair', quantity: 1 }]);
    expect(screen.getByRole('dialog', { name: 'Корзина' })).toBeInTheDocument();
  });
});
