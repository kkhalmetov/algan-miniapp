import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('startup splash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: false,
      legalAcceptance: undefined,
      profile: { firstName: '' },
      locale: 'ru',
      tab: 'home',
      favoriteStoreIds: [],
      orders: [],
    });
  });

  afterEach(() => {
    delete window.Telegram;
    cleanup();
    vi.useRealTimers();
  });

  it('stays visible for at least 900 milliseconds', () => {
    render(<AlganApp />);

    expect(screen.getByLabelText('Algan — Загрузка')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS - 1));
    expect(screen.getByLabelText('Algan — Загрузка')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByLabelText('Algan — Загрузка')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Продолжить/i })).toBeInTheDocument();
  });

  it('waits for persisted state hydration after the minimum delay', () => {
    useAppStore.setState({ hydrated: false });
    render(<AlganApp />);

    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    expect(screen.getByLabelText('Algan — Загрузка')).toBeInTheDocument();

    act(() => useAppStore.setState({ hydrated: true }));
    expect(screen.queryByLabelText('Algan — Загрузка')).not.toBeInTheDocument();
  });

  it('syncs a Telegram avatar when user data becomes available on a retry', () => {
    useAppStore.setState({ onboardingDone: true, legalAcceptance: acceptedLegalDocuments, profile: { firstName: 'Пользователь' } });
    render(<AlganApp />);

    act(() => vi.advanceTimersByTime(300));
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: {
          user: {
            id: 123456,
            first_name: 'Kimal',
            photo_url: 'https://t.me/i/userpic/320/avatar.jpg',
          },
        },
        ready: () => undefined,
        expand: () => undefined,
      },
    };

    act(() => vi.advanceTimersByTime(450));
    expect(useAppStore.getState().profile).toMatchObject({
      telegramId: 123456,
      firstName: 'Kimal',
      photoUrl: 'https://t.me/i/userpic/320/avatar.jpg',
    });
  });

  it('does not overwrite a manually selected onboarding language on Telegram retries', () => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: {
          user: {
            id: 123456,
            first_name: 'Kimal',
            language_code: 'ru',
          },
        },
        ready: () => undefined,
        expand: () => undefined,
      },
    };
    render(<AlganApp />);

    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Русский / Қазақша' }));
    expect(useAppStore.getState().locale).toBe('kk');

    act(() => vi.advanceTimersByTime(TELEGRAM_RETRY_WINDOW_MS));
    expect(useAppStore.getState().locale).toBe('kk');
  });

  it('does not replace the default Kazakh language with the Telegram account language', () => {
    useAppStore.setState({ locale: 'kk' });
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: {
          user: {
            id: 123456,
            first_name: 'Kimal',
            language_code: 'ru',
          },
        },
        ready: () => undefined,
        expand: () => undefined,
      },
    };

    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS + TELEGRAM_RETRY_WINDOW_MS));

    expect(useAppStore.getState().locale).toBe('kk');
    expect(screen.getByRole('button', { name: /Жалғастыру/i })).toBeInTheDocument();
  });
});

const TELEGRAM_RETRY_WINDOW_MS = 2500;
