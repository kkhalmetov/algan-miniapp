import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { LEGAL_DOCUMENT_VERSION } from '../lib/legal-documents';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('onboarding legal consent', () => {
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
    cleanup();
    vi.useRealTimers();
  });

  const openOnboarding = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
  };

  it('replaces checkboxes with three linked legal documents', () => {
    openOnboarding();

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Нажимая «Продолжить», вы автоматически принимаете условия использования, даёте согласие на сбор и обработку персональных данных и подтверждаете ознакомление с политикой конфиденциальности')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'политикой конфиденциальности' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' }));
    expect(screen.getByRole('dialog', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByText('Субъект персональных данных')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
    expect(screen.getByText(/ИП «ALGAN», ИИН 030705500040/)).toBeInTheDocument();
    expect(screen.queryByText(/Документ готовится/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Назад' })).not.toBeInTheDocument();
  });

  it('allows continuing with a valid phone without separate checkboxes', () => {
    openOnboarding();
    const continueButton = screen.getByRole('button', { name: /Продолжить/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: '+7 705 976 80 00' } });
    expect(continueButton).toBeEnabled();
    fireEvent.click(continueButton);

    expect(useAppStore.getState().onboardingDone).toBe(true);
    expect(useAppStore.getState().profile.phone).toBe('+77059768000');
    expect(useAppStore.getState().legalAcceptance).toMatchObject({
      version: LEGAL_DOCUMENT_VERSION,
      locale: 'ru',
      method: 'continue_button',
    });
  });

  it('personalizes the consent with Telegram identity', () => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: { user: { id: 987654, first_name: 'Алия', last_name: 'Сейдахметова' } },
        ready: () => undefined,
        expand: () => undefined,
      },
    };
    openOnboarding();
    fireEvent.click(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' }));

    expect(screen.getByText('Алия Сейдахметова')).toBeInTheDocument();
    expect(screen.getByText('987654')).toBeInTheDocument();
  });

  it('renders the full privacy policy in Kazakh', () => {
    useAppStore.setState({ locale: 'kk' });
    openOnboarding();
    fireEvent.click(screen.getByRole('button', { name: 'құпиялылық саясатымен' }));

    expect(screen.getByRole('heading', { name: 'Құпиялылық саясаты' })).toBeInTheDocument();
    expect(screen.getByText('1. Algan қандай деректерді алады')).toBeInTheDocument();
    expect(screen.getByText('Нұсқа')).toBeInTheDocument();
    expect(screen.queryByText(/Құжат дайындалып жатыр/)).not.toBeInTheDocument();
  });

  it('requires a one-time acceptance from an existing profile without clearing its data', () => {
    useAppStore.setState({
      onboardingDone: true,
      legalAcceptance: { ...acceptedLegalDocuments, version: '0.9' },
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      favoriteStoreIds: ['tatti'],
    });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    expect(screen.getByRole('heading', { name: 'Обновлены юридические документы' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Телефон/)).not.toBeInTheDocument();
    const acceptButton = screen.getByRole('button', { name: 'Принять и продолжить' });
    const legalText = screen.getByText((_, element) => element?.tagName === 'P' && element.textContent?.startsWith('Нажимая «Принять и продолжить»'));
    expect(acceptButton.compareDocumentPosition(legalText) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(acceptButton);

    expect(screen.getByText('Kimal!')).toBeInTheDocument();
    expect(useAppStore.getState().favoriteStoreIds).toEqual(['tatti']);
    expect(useAppStore.getState().legalAcceptance?.version).toBe(LEGAL_DOCUMENT_VERSION);
  });
});
