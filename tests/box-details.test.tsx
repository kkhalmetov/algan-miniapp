import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('box details Telegram safe area', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      profile: { firstName: 'Kimal' },
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

  it('keeps the cover and controls below Telegram UI', () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    const cardTitle = screen.getByRole('heading', { name: 'Большой bakery box' });
    fireEvent.click(cardTitle.closest('button')!);

    const details = document.querySelector('.algan-content-safe-top');
    expect(details).toBeInTheDocument();
    expect(details?.querySelector('img')).toHaveClass('object-cover');
    expect(details?.querySelectorAll('button')).toHaveLength(3);
  });
});
