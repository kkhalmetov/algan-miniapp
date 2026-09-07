import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { boxes, stores } from '../lib/mock-data';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('box-first catalog and details', () => {
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
      orders: [],
      cartStoreId: undefined,
      cartItems: [],
      purchasedBoxQuantities: {},
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderHome = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
  };

  const openBox = (boxName: string, storeName: string) => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: `Подробнее: ${boxName}, ${storeName}` }));
  };

  it('renders every offer directly on the home screen in catalog order', () => {
    renderHome();

    expect(screen.queryByRole('heading', { name: 'Выгодно рядом' })).not.toBeInTheDocument();
    expect(screen.queryByText('Можно забрать сегодня')).not.toBeInTheDocument();
    const cards = screen.getAllByTestId('marketplace-box-card');
    expect(cards).toHaveLength(boxes.length);
    expect(within(cards[0]!).getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(within(cards.at(-1)!).getByText('Вечерний бокс')).toBeInTheDocument();

    const firstCard = cards[0]!;
    expect(within(firstCard).getByText('Tatti Bakery')).toBeInTheDocument();
    expect(within(firstCard).getByText('пр. Тауке хана, 47')).toBeInTheDocument();
    expect(within(firstCard).getByText('19:30–20:30')).toBeInTheDocument();
    expect(within(firstCard).getByText('Осталось 4 бокса')).toBeInTheDocument();
    expect(within(firstCard).getByText('2 490 ₸')).toBeInTheDocument();
    expect(within(firstCard).getByText('6 200 ₸')).toHaveClass('line-through');
    expect(within(firstCard).getByText('−60%')).toBeInTheDocument();
    expect(within(firstCard).getByText('SURPRISE')).toHaveAttribute('data-surprise-variant', 'compact');
    expect(firstCard.querySelector(`img[src="${stores[0]!.logo}"]`)).toHaveAttribute('alt', '');

    const definedCard = cards[1]!;
    expect(within(definedCard).queryByText('SURPRISE')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Tatti Bakery' })).not.toBeInTheDocument();
  });

  it('opens surprise box details directly with venue, route, commerce and composition information', () => {
    openBox('Surprise Tatti-box', 'Tatti Bakery');

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    expect(dialog.querySelector('section')).toHaveClass('h-[92%]');
    expect(within(dialog).getByTestId('box-details-sheet')).toHaveClass('h-full');
    expect(within(dialog).getByText('Tatti Bakery')).toBeInTheDocument();
    expect(within(dialog).getByText('пр. Тауке хана, 47')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Построить маршрут' }).querySelector('svg')).not.toBeInTheDocument();
    expect(within(dialog).getByText('SURPRISE')).toHaveAttribute('data-surprise-variant', 'default');
    expect(within(dialog).getByTestId('box-price-card')).toHaveTextContent('2 490 ₸');
    expect(within(dialog).getByTestId('box-price-card')).toHaveTextContent('6 200 ₸');
    expect(within(dialog).getByTestId('box-price-card')).toHaveTextContent('−60%');
    expect(within(dialog).getByTestId('box-pickup-time')).toHaveTextContent('19:30–20:30');
    expect(within(dialog).getByTestId('box-stock')).toHaveTextContent('Осталось 4 бокса');
    expect(within(dialog).getByTestId('box-appearance-notice')).toHaveTextContent('Внешний вид продукции может отличаться от представленного на фото.');
    expect(within(dialog).getByRole('heading', { name: 'Что может быть внутри' })).toBeInTheDocument();
    expect(within(dialog).getByText('Круассаны, слойки, булочки, багеты и другая выпечка.')).toBeInTheDocument();
    const notice = within(dialog).getByTestId('surprise-composition-notice');
    expect(within(notice).getByRole('heading', { name: 'Состав — сюрприз' })).toBeInTheDocument();
    expect(within(notice).getByText('Точный набор заранее неизвестен и формируется заведением в день получения.')).toBeInTheDocument();
    expect(within(dialog).getByText('Содержит аллергены')).toBeInTheDocument();
    expect(within(dialog).getByText('Глютен, молоко, яйца')).toBeInTheDocument();
    expect(within(dialog).getByTestId('box-allergens')).toHaveClass('bg-danger-soft', 'text-danger');
  });

  it('shows exact contents without an extra type label for a regular box', () => {
    openBox('Tatti-box', 'Tatti Bakery');

    const dialog = screen.getByRole('dialog', { name: 'Tatti-box' });
    expect(within(dialog).queryByText('Состав известен')).not.toBeInTheDocument();
    const contents = within(dialog).getByTestId('box-contents');
    expect(within(contents).getAllByRole('listitem')).toHaveLength(3);
    expect(within(contents).getByText('Булочка с корицей')).toBeInTheDocument();
    expect(within(contents).getAllByText('× 1')).toHaveLength(2);
    expect(within(dialog).queryByText('Состав — сюрприз')).not.toBeInTheDocument();
    expect(within(dialog).queryByTestId('surprise-box-icon')).not.toBeInTheDocument();
  });

  it('selects quantity and exposes the saved cart from the catalog', () => {
    openBox('Surprise Tatti-box', 'Tatti Bakery');

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Количество +' }));
    const addButton = within(dialog).getByRole('button', { name: /Добавить в корзину Surprise Tatti-box/ });
    expect(addButton).toHaveTextContent('Добавить в корзину');
    expect(addButton).toHaveTextContent('4 980 ₸');
    fireEvent.click(addButton);

    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 2 }]);
    expect(screen.queryByRole('dialog', { name: 'Surprise Tatti-box' })).not.toBeInTheDocument();
    const cartDock = screen.getByTestId('cart-dock');
    expect(cartDock).toHaveTextContent(/Корзина · 2/);
    expect(cartDock).toHaveTextContent('4 980 ₸');
    fireEvent.click(within(cartDock).getByRole('button', { name: /Корзина/ }));
    expect(screen.getByRole('dialog', { name: 'Корзина' })).toBeInTheDocument();
  });

  it('favorites individual boxes and reuses their cards in Favorites', () => {
    renderHome();
    const favorite = screen.getByRole('button', { name: 'Избранное: Surprise Tatti-box' });
    fireEvent.click(favorite);
    expect(useAppStore.getState().favoriteBoxIds).toEqual(['bakery-surprise']);
    expect(favorite).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Избранное' }));
    const cards = screen.getAllByTestId('marketplace-box-card');
    expect(cards).toHaveLength(1);
    expect(within(cards[0]!).getByText('Surprise Tatti-box')).toBeInTheDocument();
    expect(within(cards[0]!).queryByText('Tatti-box')).not.toBeInTheDocument();
  });

  it('opens the existing map picker from box details', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openBox('Surprise Tatti-box', 'Tatti Bakery');

    fireEvent.click(screen.getByRole('button', { name: 'Построить маршрут' }));
    const picker = screen.getByRole('dialog', { name: 'Выберите карту' });
    expect(within(picker).getByRole('button', { name: /2GIS/ }).querySelector('img')).toHaveAttribute('src', '/images/map-providers/2gis.webp');
    expect(within(picker).getByRole('button', { name: /Яндекс Карты/ }).querySelector('img')).toHaveAttribute('src', '/images/map-providers/yandex-maps.webp');
    fireEvent.click(within(picker).getByRole('button', { name: /Google Maps/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('destination=42.3184%2C69.5907'), '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('shows a safe allergen fallback when catalog data is missing', () => {
    openBox('Зелёный бокс', 'Dastarhan Market');
    const dialog = screen.getByRole('dialog', { name: 'Зелёный бокс' });
    expect(within(dialog).getByText('Аллергены')).toBeInTheDocument();
    expect(within(dialog).getByText('Информация об аллергенах не указана. Уточните её у заведения.')).toBeInTheDocument();
  });

  it('keeps sold-out cards visible, gray and unable to open or favorite', () => {
    renderHome();

    const soldOutCard = screen.getByText('Вечерний бокс').closest('article');
    expect(soldOutCard).toHaveAttribute('data-sold-out', 'true');
    expect(within(soldOutCard!).getByText('Боксы закончились')).toBeInTheDocument();
    const offerButton = within(soldOutCard!).getByRole('button', { name: 'Подробнее: Вечерний бокс, Qamyr Bakery' });
    expect(offerButton).toBeDisabled();
    expect(within(offerButton).getByAltText('Вечерний бокс').parentElement).toHaveClass('grayscale', 'opacity-55');
    fireEvent.click(offerButton);
    expect(screen.queryByRole('dialog', { name: 'Вечерний бокс' })).not.toBeInTheDocument();

    expect(within(soldOutCard!).queryByRole('button', { name: 'Избранное: Вечерний бокс' })).not.toBeInTheDocument();
  });

  it('localizes box cards and the appearance note in Kazakh', () => {
    useAppStore.setState({ locale: 'kk' });
    renderHome();
    expect(screen.getByText('Таңғы Tatti-box')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Толығырақ: Surprise Tatti-box, Tatti Bakery' }));
    expect(screen.getByTestId('box-appearance-notice')).toHaveTextContent('Өнімдердің сыртқы көрінісі фотода көрсетілгеннен өзгеше болуы мүмкін.');
  });
});
