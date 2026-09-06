import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
      favoriteBoxIds: [],
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

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Нажимая «Продолжить», вы автоматически принимаете условия использования, даёте согласие на сбор и обработку персональных данных и подтверждаете ознакомление с политикой конфиденциальности')).toHaveClass('mt-auto', 'pt-4');
    expect(screen.getByRole('button', { name: 'условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'политикой конфиденциальности' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' }));
    const legalDialog = screen.getByRole('dialog', { name: 'Согласие на сбор и обработку персональных данных' });
    const legalHeader = within(legalDialog).getByTestId('legal-modal-header');
    const legalScroll = within(legalDialog).getByTestId('legal-modal-scroll');
    expect(legalHeader).not.toContainElement(legalScroll);
    expect(legalHeader.compareDocumentPosition(legalScroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(legalScroll).toHaveClass('overflow-y-auto');
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
    expect(continueButton.querySelector('svg')).not.toBeInTheDocument();

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
      favoriteBoxIds: ['bakery-surprise'],
    });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    expect(screen.getByRole('heading', { name: 'Обновлены юридические документы' })).toBeInTheDocument();
    const updateText = screen.getByText('Ознакомьтесь с новой редакцией документов Algan.');
    expect(screen.queryByText(/Повторно вводить номер телефона/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Телефон/)).not.toBeInTheDocument();
    const terms = screen.getByRole('button', { name: 'Условия использования' });
    const consent = screen.getByRole('button', { name: 'Согласие на сбор и обработку персональных данных' });
    const privacy = screen.getByRole('button', { name: 'Политика конфиденциальности' });
    expect(updateText.compareDocumentPosition(terms) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(terms.compareDocumentPosition(consent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(consent.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const acceptButton = screen.getByRole('button', { name: 'Принять и продолжить' });
    expect(acceptButton.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText((_, element) => element?.tagName === 'P' && element.textContent?.startsWith('Нажимая «Принять и продолжить»'))).not.toBeInTheDocument();
    expect(privacy.compareDocumentPosition(acceptButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(acceptButton);

    expect(screen.getByText('Kimal!')).toBeInTheDocument();
    expect(useAppStore.getState().favoriteBoxIds).toEqual(['bakery-surprise']);
    expect(useAppStore.getState().legalAcceptance?.version).toBe(LEGAL_DOCUMENT_VERSION);
  });
});
