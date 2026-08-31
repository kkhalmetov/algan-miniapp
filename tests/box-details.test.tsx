import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { storeMarkerHtml } from '../components/location-map';
import { stores } from '../lib/mock-data';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('store details presentation', () => {
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
  });

  const openFirstStore = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Tatti Bakery пр\. Тауке хана, 47/ }));
  };

  it('shows one clean venue card per store', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    expect(screen.getAllByRole('article')).toHaveLength(stores.length);
    stores.forEach((store) => {
      expect(screen.getByAltText(`${store.name} logo`)).toHaveAttribute('src', store.logo);
    });
    expect(screen.getAllByText('Tatti Bakery')).toHaveLength(1);
    expect(screen.queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(screen.queryByText('Tatti-box')).not.toBeInTheDocument();
    expect(screen.queryByText('2 490 ₸')).not.toBeInTheDocument();
    expect(screen.queryByText('Осталось 4 бокса')).not.toBeInTheDocument();
    expect(screen.queryByText('19:30–20:30')).not.toBeInTheDocument();
    expect(screen.queryByText('SURPRISE')).not.toBeInTheDocument();
    expect(screen.queryByText('−60%')).not.toBeInTheDocument();
    expect(screen.queryByText('Доступные заведения')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Все' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Пекарни' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Кофейни' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Магазины' })).not.toBeInTheDocument();
    expect(screen.getAllByAltText('Halal')).toHaveLength(stores.length);
  });

  it('shows venue information and all five Tatti boxes', () => {
    openFirstStore();

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    const header = within(dialog).getByTestId('store-details-header');
    const scroll = within(dialog).getByTestId('store-details-scroll');
    const cover = within(dialog).getByTestId('store-details-cover');
    expect(within(header).getByRole('button', { name: 'Назад' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Избранное' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(scroll).getByAltText('Tatti Bakery logo')).toHaveAttribute('src', stores[0]!.logo);
    expect(within(cover).queryByAltText('Halal')).not.toBeInTheDocument();
    expect(within(scroll).getByAltText('Halal')).toHaveAttribute('src', '/images/halal-logo.svg');
    expect(within(scroll).queryByText('Доступные боксы')).not.toBeInTheDocument();
    expect(within(scroll).getAllByRole('button', { name: /^Подробнее / })).toHaveLength(5);
    expect(within(scroll).getAllByText('SURPRISE')).toHaveLength(2);
    expect(within(scroll).getByText('пр. Тауке хана, 47')).toBeInTheDocument();
    expect(within(scroll).queryByTestId('store-pickup-time')).not.toBeInTheDocument();
    expect(within(scroll).getByAltText('Surprise Tatti-box')).toHaveAttribute('src', '/images/bakery.jpg');
    expect(within(scroll).getByText('Время выдачи: 19:30–20:30')).toHaveClass('whitespace-nowrap');
    expect(within(scroll).getByText('Время выдачи: 18:30–19:30')).toBeInTheDocument();
    const appearanceNotice = within(scroll).getByTestId('store-appearance-notice');
    expect(within(appearanceNotice).getByRole('heading', { name: 'Внешний вид может отличаться' })).toBeInTheDocument();
    expect(within(appearanceNotice).getByText('Фактический внешний вид бокса и продуктов может отличаться от изображения.')).toBeInTheDocument();
    expect(header.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens a box with its full catalog information', () => {
    openFirstStore();
    const storeDialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    expect(within(storeDialog).queryByRole('button', { name: /^Добавить / })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее Surprise Tatti-box' }));

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    expect(within(dialog).getByTestId('box-details-sheet')).toHaveClass('h-[80dvh]');
    expect(within(dialog).getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
    expect(within(dialog).queryByText('Tatti Bakery')).not.toBeInTheDocument();
    const scroll = within(dialog).getByTestId('box-details-scroll');
    expect(within(dialog).queryByTestId('box-details-cover')).not.toBeInTheDocument();
    expect(within(scroll).getByText('SURPRISE')).toBeInTheDocument();
    expect(within(scroll).getByRole('heading', { name: 'Что может быть внутри' })).toBeInTheDocument();
    expect(within(scroll).getByText('Круассаны, слойки, булочки, багеты и другая выпечка.')).toBeInTheDocument();
    const surpriseNotice = within(scroll).getByTestId('surprise-composition-notice');
    expect(within(surpriseNotice).getByRole('heading', { name: 'Состав — сюрприз' })).toBeInTheDocument();
    expect(within(surpriseNotice).getByText('Точный набор заранее неизвестен и формируется заведением в день получения.')).toBeInTheDocument();
    expect(surpriseNotice).not.toHaveTextContent(/остат/i);
    expect(within(scroll).getByTestId('box-stock')).toHaveTextContent('Осталось 4 бокса');
    expect(within(within(scroll).getByTestId('box-price-card')).getByText('−60%')).toBeInTheDocument();
    expect(within(scroll).getByTestId('box-pickup-time')).toHaveTextContent('Время выдачи19:30–20:30');
    expect(within(scroll).queryByTestId('box-appearance-notice')).not.toBeInTheDocument();
    expect(within(scroll).getByText('Содержит аллергены')).toBeInTheDocument();
    expect(within(scroll).getByText('Глютен, молоко, яйца')).toBeInTheDocument();
    const addToCartButton = within(dialog).getByRole('button', { name: 'Добавить в корзину Surprise Tatti-box' });
    expect(addToCartButton.closest('footer')).toBeInTheDocument();
    expect(addToCartButton).toHaveClass('text-sm', 'whitespace-normal');
    expect(addToCartButton).not.toHaveStyle({ fontSize: '12px' });
    expect(within(dialog).getByRole('group', { name: 'Количество' })).toHaveTextContent('1');
  });

  it('selects a quantity before adding it to the cart from box details', () => {
    openFirstStore();
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее Surprise Tatti-box' }));

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Количество +' }));
    expect(useAppStore.getState().cartItems).toEqual([]);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Добавить в корзину Surprise Tatti-box' }));
    expect(useAppStore.getState().cartItems).toEqual([{ boxId: 'bakery-surprise', quantity: 2 }]);
    expect(screen.queryByRole('dialog', { name: 'Surprise Tatti-box' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Tatti Bakery' })).toBeInTheDocument();
  });

  it('toggles favorite and closes from the persistent header', () => {
    openFirstStore();

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    const favorite = within(dialog).getByRole('button', { name: 'Избранное' });
    fireEvent.click(favorite);
    expect(favorite).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Назад' }));
    expect(screen.queryByRole('dialog', { name: 'Tatti Bakery' })).not.toBeInTheDocument();
  });

  it('opens a map picker from the redesigned address card', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openFirstStore();

    const buildRouteButton = screen.getByRole('button', { name: 'Построить маршрут' });
    expect(buildRouteButton.querySelector('svg')).not.toBeInTheDocument();
    fireEvent.click(buildRouteButton);
    const picker = screen.getByRole('dialog', { name: 'Выберите карту' });
    expect(within(picker).queryByText('пр. Тауке хана, 47')).not.toBeInTheDocument();
    expect(within(picker).queryByText('Маршрут будет построен от вашего местоположения.')).not.toBeInTheDocument();
    expect(within(picker).getByAltText('2GIS logo')).toHaveAttribute('src', '/images/map-providers/2gis.jpg');
    expect(within(picker).getByAltText('Яндекс Карты logo')).toHaveAttribute('src', '/images/map-providers/yandex-maps.jpg');
    expect(within(picker).getByAltText('Google Maps logo')).toHaveAttribute('src', '/images/map-providers/google-maps.jpg');
    fireEvent.click(within(picker).getByRole('button', { name: /Google Maps/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('destination=42.3184%2C69.5907'), '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('shows a safe allergen fallback when catalog data is missing', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Dastarhan Market ул\. Желтоксан, 19/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее Зелёный бокс' }));

    const dialog = screen.getByRole('dialog', { name: 'Зелёный бокс' });
    expect(within(dialog).getByText('Аллергены')).toBeInTheDocument();
    expect(within(dialog).getByText('Информация об аллергенах не указана. Уточните её у заведения.')).toBeInTheDocument();
  });

  it('shows a sold-out venue and disables purchasing', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const soldOutCard = screen.getByText('Qamyr Bakery').closest('article');
    expect(soldOutCard).not.toBeNull();
    expect(within(soldOutCard!).queryByText('Боксы закончились')).not.toBeInTheDocument();
    fireEvent.click(within(soldOutCard!).getByRole('button', { name: /Qamyr Bakery ул\. Рыскулова, 18/ }));
    const storeDialog = screen.getByRole('dialog', { name: 'Qamyr Bakery' });
    expect(within(storeDialog).getAllByText('Боксы закончились')).toHaveLength(1);
    expect(within(storeDialog).queryByRole('button', { name: 'Добавить Вечерний бокс' })).not.toBeInTheDocument();
    fireEvent.click(within(storeDialog).getByRole('button', { name: 'Подробнее Вечерний бокс' }));

    const dialog = screen.getByRole('dialog', { name: 'Вечерний бокс' });
    expect(within(dialog).getByTestId('box-stock')).toHaveTextContent('Боксы закончились');
    expect(within(dialog).queryByRole('button', { name: 'Добавить Вечерний бокс' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});

describe('store map markers', () => {
  it('renders the assigned store logo inside marker HTML', () => {
    stores.forEach((store) => {
      expect(storeMarkerHtml(store.logo)).toContain(`src="${store.logo}"`);
    });
  });
});
