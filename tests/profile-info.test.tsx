import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('profile information sections', () => {
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

  const openProfile = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Профиль' }));
  };

  it('groups all legal documents under one profile action', () => {
    openProfile();

    expect(screen.queryByRole('button', { name: 'Условия использования' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Политика конфиденциальности' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'О Algan' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Документы' }));

    expect(screen.getByRole('heading', { name: 'Документы' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Политика конфиденциальности' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Публичная оферта' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Правила заказа, получения, отмены и возврата' }));
    expect(screen.getByRole('heading', { name: 'Правила заказа, получения, отмены и возврата' })).toBeInTheDocument();
    expect(screen.getByText(/Документ готовится/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);
    expect(screen.getByRole('heading', { name: 'Документы' })).toBeInTheDocument();
  });

});
