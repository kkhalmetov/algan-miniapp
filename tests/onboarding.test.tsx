import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';

describe('onboarding legal consent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
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

  const openOnboarding = () => {
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));
  };

  it('replaces checkboxes with three linked legal documents', () => {
    openOnboarding();

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Нажимая «Продолжить», вы автоматически принимаете условия использования, даете согласие на сбор и обработку персональных данных и подтверждаете ознакомление с политикой конфиденциальности')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'политикой конфиденциальности' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'согласие на сбор и обработку персональных данных' }));
    expect(screen.getByRole('dialog', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
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
  });
});
