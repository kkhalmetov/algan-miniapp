import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlganApp, { MINIMUM_SPLASH_MS } from '../app/app-client';
import { useAppStore } from '../lib/store';
import { acceptedLegalDocuments } from './test-state';

describe('profile information sections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.Telegram;
    useAppStore.setState({
      hydrated: true,
      onboardingDone: true,
      legalAcceptance: acceptedLegalDocuments,
      profile: { firstName: 'Kimal', phone: '+77059768000' },
      locale: 'ru',
      currency: 'KZT',
      tab: 'home',
      favoriteBoxIds: [],
      orders: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('keeps a long profile identity inside the mobile header', () => {
    useAppStore.setState({
      profile: { firstName: 'Оченьдлинноеимябезпробелов', lastName: 'Очень длинная фамилия', phone: '+77059768000' },
    });
    openProfile();

    const heading = screen.getByRole('heading', { name: 'Оченьдлинноеимябезпробелов Очень длинная фамилия' });
    expect(heading).toHaveClass('break-words');
    expect(heading.parentElement).toHaveClass('min-w-0', 'flex-1');
    expect(heading.nextElementSibling).toHaveClass('truncate');
  });

  it('groups all legal documents under one profile action', async () => {
    openProfile();

    expect(screen.queryByRole('button', { name: 'Условия использования' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Политика конфиденциальности' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'О Algan' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Правовая информация' }));

    expect(screen.getByRole('heading', { name: 'Правовая информация' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Документы и соглашения', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'О компании', level: 3 })).toBeInTheDocument();
    expect(screen.queryByText(/Документы, которые регулируют использование Algan/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Условия использования' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Политика конфиденциальности' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Публичная оферта' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Реквизиты и контакты' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Реквизиты и контакты' }));
    expect(screen.getByRole('heading', { name: 'Реквизиты и контакты', level: 2 })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'ИП «ALGAN»', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('ИП «ALGAN»')).toBeInTheDocument();
    expect(screen.getByText('ИИН: 030705500040')).toBeInTheDocument();
    expect(screen.getByText('Адрес')).toBeInTheDocument();
    expect(screen.getByText(/Аль-Фарабийский район/)).toBeInTheDocument();
    expect(screen.queryByText('Ежедневно с 09:00 до 21:00')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /algansupport@gmail.com/ })).toHaveAttribute('href', 'mailto:algansupport@gmail.com');
    expect(screen.getByRole('link', { name: /\+7 705 976 80 00/ })).toHaveAttribute('href', 'tel:+77059768000');
    expect(screen.getAllByRole('button', { name: 'Назад' })).toHaveLength(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Согласие на сбор и обработку персональных данных' }));
    await act(async () => { await vi.dynamicImportSettled(); });
    const consentDialog = screen.getByRole('dialog', { name: 'Правовая информация' });
    const documentHeader = within(consentDialog).getByTestId('documents-modal-header');
    const documentScroll = within(consentDialog).getByTestId('documents-modal-scroll');
    expect(documentHeader).not.toContainElement(documentScroll);
    expect(documentHeader.compareDocumentPosition(documentScroll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(documentScroll).toHaveClass('overflow-y-auto');
    expect(within(consentDialog).getByRole('heading', { name: 'Согласие на сбор и обработку персональных данных' })).toBeInTheDocument();
    expect(within(consentDialog).getByText('Kimal')).toBeInTheDocument();
    expect(within(consentDialog).getByText('+77059768000')).toBeInTheDocument();
    expect(within(consentDialog).getByText('1. Перечень персональных данных')).toBeInTheDocument();
    expect(within(consentDialog).queryByText(/Документ готовится/)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);

    fireEvent.click(screen.getByRole('button', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' }));
    expect(screen.getByRole('heading', { name: 'Правила заказа, оплаты, самовывоза, отмены и возврата' })).toBeInTheDocument();
    expect(screen.getByText(/Документ готовится/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Назад' })).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Назад' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Публичная оферта' }));
    expect(screen.getByRole('heading', { name: 'Публичная оферта' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Назад' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('heading', { name: 'Правовая информация' })).toBeInTheDocument();
  });

  it('opens help and FAQ answers without company details', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    openProfile();

    const settings = screen.getByRole('button', { name: 'Настройки' });
    const support = screen.getByRole('button', { name: 'Помощь и поддержка' });
    const legal = screen.getByRole('button', { name: 'Правовая информация' });
    expect(settings.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(support.compareDocumentPosition(legal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(support);
    expect(screen.getByRole('heading', { name: 'Помощь и поддержка' })).toBeInTheDocument();
    expect(screen.getByText(/Мы рядом, если появились вопросы/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FAQ' })).toBeInTheDocument();
    const contactSupport = screen.getByRole('button', { name: /Связаться с поддержкой.*Ежедневно с 09:00 до 21:00/ });
    expect(contactSupport).toBeInTheDocument();
    expect(screen.queryByText('@kkhalmetov')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Реквизиты и контакты' })).not.toBeInTheDocument();
    fireEvent.click(contactSupport);
    expect(open).toHaveBeenCalledWith('https://t.me/alganonline_bot', '_blank', 'noopener,noreferrer');

    fireEvent.click(screen.getByRole('button', { name: 'FAQ' }));
    expect(screen.getByRole('heading', { name: 'FAQ', level: 2 })).toHaveFocus();
    const question = screen.getByRole('button', { name: 'Как купить бокс?' });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/После оплаты заказ появится/)).toBeInTheDocument();
    fireEvent.click(question);
    expect(screen.queryByText(/После оплаты заказ появится/)).not.toBeInTheDocument();
  });

  it('groups phone and language controls under settings', () => {
    openProfile();

    expect(screen.queryByRole('button', { name: /Номер телефона/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Язык/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Настройки' }));

    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Контактные данные', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Язык приложения', level: 3 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Номер телефона.*\+7 705 976 80 00/ }));
    const phoneDialog = screen.getByRole('dialog', { name: 'Сменить номер телефона' });
    const phoneInput = within(phoneDialog).getByDisplayValue('+7 705 976 80 00');
    expect(phoneInput).toBeInTheDocument();
    expect(within(phoneDialog).queryByText('Используйте действующий номер Казахстана в формате +7.')).not.toBeInTheDocument();
    expect(within(phoneDialog).queryByText('Номер указан верно')).not.toBeInTheDocument();
    expect(within(phoneDialog).queryByRole('heading', { name: 'Номер телефона' })).not.toBeInTheDocument();
    expect(within(phoneDialog).getByRole('button', { name: 'Сохранить номер' }).querySelector('svg')).not.toBeInTheDocument();
    fireEvent.change(phoneInput, { target: { value: '+7 700' } });
    expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    expect(within(phoneDialog).getByRole('alert')).toHaveTextContent('Введите корректный номер Казахстана.');
    fireEvent.click(within(phoneDialog).getByRole('button', { name: 'Закрыть' }));
    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeInTheDocument();
    const languageChoice = screen.getByRole('group', { name: 'Язык приложения' });
    expect(within(languageChoice).getByRole('button', { name: 'Русский' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(languageChoice).getByRole('button', { name: 'Қазақша' }));
    expect(screen.getByRole('heading', { name: 'Баптаулар' })).toBeInTheDocument();
    expect(useAppStore.getState().locale).toBe('kk');
    expect(document.documentElement.lang).toBe('kk');
    expect(document.title).toBe('Algan — тиімді ұсыныстар жаныңызда');
  });

  it('groups currency with preferences before demo reset and loads the RUB rate', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 'success', rates: { RUB: 0.185297 } }) }));
    openProfile();

    const reset = screen.getByRole('button', { name: 'Сбросить демо-данные' });
    const switchCurrency = screen.getByRole('button', { name: 'Показывать цены в рублях' });
    expect(switchCurrency.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await act(async () => {
      fireEvent.click(switchCurrency);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useAppStore.getState().currency).toBe('RUB');
    expect(screen.getByRole('button', { name: 'Показывать цены в тенге' })).toBeInTheDocument();
  });

  it('confirms demo reset inside the shared app dialog', () => {
    openProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить демо-данные' }));
    const confirmation = screen.getByRole('dialog', { name: 'Сбросить демо-данные' });
    expect(within(confirmation).getByText(/Профиль, корзина, избранное и история заказов будут удалены/)).toBeInTheDocument();
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Отмена' }));
    expect(useAppStore.getState().onboardingDone).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить демо-данные' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Сбросить демо-данные' })).getByRole('button', { name: 'Сбросить демо-данные' }));
    expect(useAppStore.getState().onboardingDone).toBe(false);
    expect(useAppStore.getState().legalAcceptance).toBeUndefined();
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

  it('localizes the browser fallback identity after switching languages', () => {
    useAppStore.setState({ profile: { firstName: 'Пользователь', phone: '+77059768000' }, locale: 'kk', tab: 'home' });
    render(<AlganApp />);
    act(() => vi.advanceTimersByTime(MINIMUM_SPLASH_MS));

    expect(screen.getByText('Қолданушы!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Профиль' }));
    expect(screen.getByRole('heading', { name: 'Қолданушы' })).toBeInTheDocument();
  });

});
