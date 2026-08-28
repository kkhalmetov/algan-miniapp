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

  it('shows the Telegram username below the profile name', () => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: { user: { id: 123456, first_name: 'Kimal', username: 'kkhalmetov' } },
        ready: () => undefined,
        expand: () => undefined,
      },
    };
    openProfile();

    const heading = screen.getByRole('heading', { name: 'Kimal' });
    expect(heading.parentElement).toHaveTextContent('@kkhalmetov');
    expect(heading.parentElement).not.toHaveTextContent('+7 705 976 80 00');
  });

  it('groups all legal documents under one profile action', () => {
    openProfile();

    expect(screen.queryByRole('button', { name: 'Условия использования' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Политика конфиденциальности' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'О Algan' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Правовая информация' }));

    expect(screen.getByRole('heading', { name: 'Правовая информация' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Политика конфиденциальности' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Публичная оферта' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Реквизиты и контакты' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Реквизиты и контакты' }));
    expect(screen.getByRole('heading', { name: 'Реквизиты и контакты' })).toBeInTheDocument();
    expect(screen.getByText('ИП «ALGAN»')).toBeInTheDocument();
    expect(screen.getByText('ИИН: 030705500040')).toBeInTheDocument();
    expect(screen.getByText('Юридический адрес')).toBeInTheDocument();
    expect(screen.getByText(/Аль-Фарабийский район/)).toBeInTheDocument();
    expect(screen.getByText('График работы')).toBeInTheDocument();
    expect(screen.getByText('Ежедневно с 09:00 до 21:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algansupport@gmail.com/ })).toHaveAttribute('href', 'mailto:algansupport@gmail.com');
    expect(screen.getByRole('link', { name: /\+7 705 976 80 00/ })).toHaveAttribute('href', 'tel:+77059768000');
    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Согласие на сбор и обработку персональных данных' }));
    expect(screen.getByRole('heading', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' }));
    expect(screen.getByRole('heading', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' })).toBeInTheDocument();
    expect(screen.getByText(/Документ готовится/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);
    expect(screen.getByRole('heading', { name: 'Правовая информация' })).toBeInTheDocument();
  });

  it('opens help and FAQ answers without company details', () => {
    openProfile();

    const language = screen.getByRole('button', { name: /Язык/ });
    const support = screen.getByRole('button', { name: 'Помощь и поддержка' });
    const legal = screen.getByRole('button', { name: 'Правовая информация' });
    expect(language.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(support.compareDocumentPosition(legal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(support);
    expect(screen.getByRole('heading', { name: 'Помощь и поддержка' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FAQ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Связаться с поддержкой' })).toBeInTheDocument();
    expect(screen.queryByText('@kkhalmetov')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Реквизиты и контакты' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    const question = screen.getByRole('button', { name: 'Как купить бокс?' });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/После оплаты заказ появится/)).toBeInTheDocument();
    fireEvent.click(question);
    expect(screen.queryByText(/После оплаты заказ появится/)).not.toBeInTheDocument();
  });

  it('shows localized help content in Kazakh', () => {
    useAppStore.setState({ locale: 'kk', tab: 'profile' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    fireEvent.click(screen.getByRole('button', { name: 'Көмек және қолдау' }));
    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Боксты қалай сатып алуға болады?' }));
    expect(screen.getByText(/Төлемнен кейін тапсырыс/)).toBeInTheDocument();
  });

});
