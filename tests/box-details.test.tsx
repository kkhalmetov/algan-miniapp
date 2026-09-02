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
      const card = screen.getByRole('button', { name: `Подробнее: ${store.name}` });
      expect(card.querySelector(`img[src="${store.logo}"]`)).toHaveAttribute('alt', '');
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
    expect(scroll.querySelector(`img[src="${stores[0]!.logo}"]`)).toHaveAttribute('alt', '');
    expect(within(cover).queryByAltText('Halal')).not.toBeInTheDocument();
    expect(within(scroll).getByAltText('Halal')).toHaveAttribute('src', '/images/halal-logo.svg');
    expect(within(scroll).queryByText('Доступные боксы')).not.toBeInTheDocument();
    expect(within(scroll).getAllByRole('button', { name: /^Подробнее / })).toHaveLength(5);
    expect(within(scroll).getAllByText('SURPRISE')).toHaveLength(2);
    expect(within(scroll).getByText('пр. Тауке хана, 47')).toBeInTheDocument();
    expect(within(scroll).queryByTestId('store-pickup-time')).not.toBeInTheDocument();
    const firstBoxCard = within(scroll).getByRole('button', { name: 'Подробнее Surprise Tatti-box' });
    const boxImage = within(firstBoxCard).getByTestId('box-card-image');
    const boxContent = within(firstBoxCard).getByTestId('box-card-content');
    const boxPhoto = within(boxImage).getByAltText('Surprise Tatti-box');
    expect(firstBoxCard).toHaveClass('group');
    expect(boxPhoto).toHaveAttribute('src', '/images/bakery.jpg');
    expect(boxPhoto).toHaveClass('transition', 'duration-[var(--motion-slow)]', 'group-hover:scale-105');
    expect(within(boxImage).getByText('SURPRISE')).toBeInTheDocument();
    expect(within(boxImage).getByText('Осталось 4 бокса')).toBeInTheDocument();
    expect(within(boxContent).queryByText('SURPRISE')).not.toBeInTheDocument();
    expect(within(boxContent).queryByText('Осталось 4 бокса')).not.toBeInTheDocument();
    expect(boxImage.compareDocumentPosition(boxContent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(boxImage).toHaveClass('h-36', 'w-full');
    const regularBoxCard = within(scroll).getByRole('button', { name: 'Подробнее Tatti-box' });
    expect(within(regularBoxCard).queryByText('SURPRISE')).not.toBeInTheDocument();
    expect(within(within(regularBoxCard).getByTestId('box-card-image')).getByText('Осталось 3 бокса')).toBeInTheDocument();
    expect(within(regularBoxCard).getByTestId('box-card-content')).toHaveClass('relative');
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
    expect(within(dialog).getByTestId('box-details-sheet')).toHaveClass('h-[90dvh]', 'sm:h-[700px]');
    expect(within(dialog).queryByText('Tatti Bakery')).not.toBeInTheDocument();
    const scroll = within(dialog).getByTestId('box-details-scroll');
    const cover = within(scroll).getByTestId('box-details-cover');
    const content = within(scroll).getByTestId('box-details-content');
    const close = within(dialog).getByRole('button', { name: 'Закрыть' });
    expect(cover).toContainElement(close);
    expect(within(cover).getByAltText('Surprise Tatti-box')).toHaveAttribute('src', '/images/bakery.jpg');
    expect(cover).toHaveClass('h-[220px]', 'w-full', 'relative');
    expect(content).toHaveClass('-mt-5', 'bg-surface');
    expect(content).not.toHaveClass('rounded-t-card');
    expect(cover.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(scroll).getByText('SURPRISE')).toBeInTheDocument();
    expect(within(scroll).getByRole('heading', { name: 'Что может быть внутри' })).toBeInTheDocument();
    expect(within(scroll).getByText('Круассаны, слойки, булочки, багеты и другая выпечка.')).toBeInTheDocument();
    const surpriseNotice = within(scroll).getByTestId('surprise-composition-notice');
    expect(within(surpriseNotice).getByRole('heading', { name: 'Состав — сюрприз' })).toBeInTheDocument();
    expect(within(surpriseNotice).getByText('Точный набор заранее неизвестен и формируется заведением в день получения.')).toBeInTheDocument();
    expect(surpriseNotice).not.toHaveTextContent(/остат/i);
    expect(within(scroll).getByTestId('box-stock')).toHaveTextContent('Осталось 4 бокса');
    const commerceSummary = within(scroll).getByTestId('box-commerce-summary');
    expect(within(commerceSummary).getByTestId('box-price-card')).toHaveTextContent('2 490 ₸');
    expect(within(commerceSummary).getByText('−60%')).toBeInTheDocument();
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

  it('uses one compact visible composition list for a defined box', () => {
    openFirstStore();
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее Tatti-box' }));

    const dialog = screen.getByRole('dialog', { name: 'Tatti-box' });
    const contents = within(dialog).getByTestId('box-contents');
    expect(contents).toHaveClass('overflow-hidden', 'border', 'bg-panel');
    expect(within(contents).getAllByRole('listitem')).toHaveLength(3);
    expect(within(contents).getByText('Булочка с корицей')).toBeInTheDocument();
    expect(within(contents).getAllByText('× 1')).toHaveLength(2);
    expect(within(dialog).queryByText('Состав — сюрприз')).not.toBeInTheDocument();
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
    expect(within(picker).getByRole('button', { name: /2GIS/ }).querySelector('img')).toHaveAttribute('src', '/images/map-providers/2gis.jpg');
    expect(within(picker).getByRole('button', { name: /Яндекс Карты/ }).querySelector('img')).toHaveAttribute('src', '/images/map-providers/yandex-maps.jpg');
    expect(within(picker).getByRole('button', { name: /Google Maps/ }).querySelector('img')).toHaveAttribute('src', '/images/map-providers/google-maps.jpg');
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
