import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { boxes } from '../lib/mock-data';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('box types', () => {
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

  it('keeps mock data compatible with the backend box type contract', () => {
    expect(boxes.every((box) => box.type === 'SURPRISE' || box.type === 'DEFINED')).toBe(true);
    expect(boxes.filter((box) => box.type === 'SURPRISE').every((box) => !box.contents?.length)).toBe(true);
    expect(boxes.filter((box) => box.type === 'DEFINED').every((box) => Boolean(box.contents?.length))).toBe(true);
  });

  it('prioritizes only the first optimized catalog image', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const cards = screen.getAllByTestId('marketplace-box-card');
    const firstImage = within(cards[0]!).getByRole('img', { name: 'Surprise Tatti-box' });
    const secondImage = within(cards[1]!).getByRole('img', { name: 'Tatti-box' });
    expect(firstImage).toHaveAttribute('src', '/images/bakery.webp');
    expect(firstImage).toHaveAttribute('loading', 'eager');
    expect(firstImage).toHaveAttribute('fetchpriority', 'high');
    expect(firstImage).toHaveAttribute('decoding', 'async');
    expect(secondImage).toHaveAttribute('loading', 'lazy');
    expect(secondImage).toHaveAttribute('fetchpriority', 'auto');
  });

  it('uses the localized surprise explanation in Kazakh', () => {
    useAppStore.setState({ locale: 'kk' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Толығырақ: Surprise Tatti-box, Tatti Bakery' }));

    const dialog = screen.getByRole('dialog', { name: 'Surprise Tatti-box' });
    expect(within(dialog).getByRole('heading', { name: 'Ішінде не болуы мүмкін' })).toBeInTheDocument();
    expect(within(dialog).getByText('Круассандар, қатпарлы қамыр өнімдері, тоқаштар, багеттер және басқа да пісірмелер.')).toBeInTheDocument();
    expect(within(dialog).getByText('Нақты жиынтық алдын ала белгісіз және оны мекеме тапсырысты алатын күні қалыптастырады.')).toBeInTheDocument();
    expect(within(dialog).getByText('Өнімдердің сыртқы көрінісі фотода көрсетілгеннен өзгеше болуы мүмкін.')).toBeInTheDocument();
    expect(within(dialog).getByText('SURPRISE')).toBeInTheDocument();
  });
});
