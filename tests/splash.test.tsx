import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('startup splash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.setState({
      hydrated: true,
      onboardingDone: false,
      profile: { firstName: '' },
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

  it('stays visible for at least 900 milliseconds', () => {
    render(<AlganApp />);

    expect(screen.getByLabelText('Algan загружается')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS - 1));
    expect(screen.getByLabelText('Algan загружается')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByLabelText('Algan загружается')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Продолжить/i })).toBeInTheDocument();
  });

  it('waits for persisted state hydration after the minimum delay', () => {
    useAppStore.setState({ hydrated: false });
    render(<AlganApp />);

    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    expect(screen.getByLabelText('Algan загружается')).toBeInTheDocument();

    act(() => useAppStore.setState({ hydrated: true }));
    expect(screen.queryByLabelText('Algan загружается')).not.toBeInTheDocument();
  });
});
