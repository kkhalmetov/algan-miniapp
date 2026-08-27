import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { storeMarkerHtml } from '../components/location-map';
import { stores } from '../lib/mock-data';
import { useAppStore } from '../lib/store';

describe('store details presentation', () => {
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
    expect(screen.queryByAltText('Halal')).not.toBeInTheDocument();
  });

  it('keeps navigation controls outside the scrolling cover and content', () => {
    openFirstStore();

    const dialog = screen.getByRole('dialog', { name: 'Tatti Bakery' });
    const header = within(dialog).getByTestId('box-details-header');
    const scroll = within(dialog).getByTestId('box-details-scroll');
    const cover = within(dialog).getByTestId('box-details-cover');
    expect(within(header).getByRole('button', { name: 'Назад' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Избранное' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(scroll).getByAltText('Tatti Bakery logo')).toHaveAttribute('src', stores[0]!.logo);
    expect(within(cover).queryByAltText('Halal')).not.toBeInTheDocument();
    expect(within(scroll).queryByText('Свежая выпечка дня: круассаны, слойки и хлеб. Точный состав станет сюрпризом.')).not.toBeInTheDocument();
    expect(within(scroll).getByText('SURPRISE')).toBeInTheDocument();
    expect(within(cover).queryByText('SURPRISE')).not.toBeInTheDocument();
    expect(within(scroll).getByText('Точный состав этого бокса заранее неизвестен — содержимое станет сюрпризом.')).toBeInTheDocument();
    expect(within(scroll).queryByText('Surprise Tatti-box')).not.toBeInTheDocument();
    expect(within(scroll).getByTestId('box-stock')).toHaveTextContent('Осталось 4 бокса');
    expect(screen.queryByText(/4\.9/)).not.toBeInTheDocument();
    expect(within(within(scroll).getByTestId('box-price-card')).getByText('−60%')).toBeInTheDocument();
    expect(within(scroll).getByTestId('box-pickup-card')).toHaveTextContent('19:30–20:30');
    expect(within(scroll).getByText('Содержит аллергены')).toBeInTheDocument();
    expect(within(scroll).getByText('Глютен, молоко, яйца')).toBeInTheDocument();
    expect(within(scroll).queryByText('0.8 км')).not.toBeInTheDocument();
    expect(within(scroll).queryByText(/−60% скидка/)).not.toBeInTheDocument();
    expect(header.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(scroll).queryByRole('button', { name: 'Купить бокс' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Купить бокс' }).closest('footer')).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'Построить маршрут' }));
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

    const dialog = screen.getByRole('dialog', { name: 'Dastarhan Market' });
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

    const dialog = screen.getByRole('dialog', { name: 'Qamyr Bakery' });
    expect(within(dialog).getByTestId('box-stock')).toHaveTextContent('Боксы закончились');
    expect(within(dialog).getByRole('button', { name: 'Купить бокс' })).toBeDisabled();
  });
});

describe('store map markers', () => {
  it('renders the assigned store logo inside marker HTML', () => {
    stores.forEach((store) => {
      expect(storeMarkerHtml(store.logo)).toContain(`src="${store.logo}"`);
    });
  });
});
