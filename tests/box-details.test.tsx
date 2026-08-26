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

  const openFirstBox = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Tatti Bakery Большой bakery box/ }));
  };

  it('shows a store logo on every home card', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    stores.forEach((store) => {
      expect(screen.getByAltText(`${store.name} logo`)).toHaveAttribute('src', store.logo);
    });
  });

  it('keeps navigation controls outside the scrolling cover and content', () => {
    openFirstBox();

    const dialog = screen.getByRole('dialog', { name: 'Большой bakery box' });
    const header = within(dialog).getByTestId('box-details-header');
    const scroll = within(dialog).getByTestId('box-details-scroll');
    const cover = within(dialog).getByTestId('box-details-cover');
    expect(within(header).getByRole('button', { name: 'Назад' })).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Избранное' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(scroll).getByAltText('Tatti Bakery logo')).toHaveAttribute('src', stores[0]!.logo);
    expect(within(cover).getByAltText('Halal')).toHaveAttribute('src', '/images/halal-sign.png');
    expect(within(scroll).queryByText('Свежая выпечка дня: круассаны, слойки и хлеб. Точный состав станет сюрпризом.')).not.toBeInTheDocument();
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
    openFirstBox();

    const dialog = screen.getByRole('dialog', { name: 'Большой bakery box' });
    const favorite = within(dialog).getByRole('button', { name: 'Избранное' });
    fireEvent.click(favorite);
    expect(favorite).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Назад' }));
    expect(screen.queryByRole('dialog', { name: 'Большой bakery box' })).not.toBeInTheDocument();
  });

  it('opens a map picker from the redesigned address card', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openFirstBox();

    fireEvent.click(screen.getByRole('button', { name: 'Построить маршрут' }));
    const picker = screen.getByRole('dialog', { name: 'Выберите карту' });
    expect(within(picker).getByRole('button', { name: /2GIS/ })).toBeInTheDocument();
    expect(within(picker).getByRole('button', { name: /Яндекс Карты/ })).toBeInTheDocument();
    fireEvent.click(within(picker).getByRole('button', { name: /Google Maps/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('destination=42.3184%2C69.5907'), '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('shows a safe allergen fallback when catalog data is missing', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: /Dastarhan Market Зелёный бокс/ }));

    const dialog = screen.getByRole('dialog', { name: 'Зелёный бокс' });
    expect(within(dialog).getByText('Аллергены')).toBeInTheDocument();
    expect(within(dialog).getByText('Информация об аллергенах не указана. Уточните её у заведения.')).toBeInTheDocument();
  });
});

describe('store map markers', () => {
  it('renders the assigned store logo inside marker HTML', () => {
    stores.forEach((store) => {
      expect(storeMarkerHtml(store.logo)).toContain(`src="${store.logo}"`);
    });
  });
});
