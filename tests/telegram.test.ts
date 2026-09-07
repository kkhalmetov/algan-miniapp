import { afterEach, describe, expect, it, vi } from 'vitest';
import { haptic, openExternalLink, openTelegramLink, prepareTelegram, setTelegramClosingConfirmation, telegramProfile } from '../lib/telegram';

describe('Telegram profile adapter', () => {
  afterEach(() => {
    delete window.Telegram;
  });

  it('reads the user name, locale, and avatar URL from Telegram', () => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        initDataUnsafe: {
          user: {
            id: 123456,
            first_name: 'Kimal',
            last_name: 'A',
            username: 'kkhalmetov',
            language_code: 'kk-KZ',
            photo_url: 'https://t.me/i/userpic/320/avatar.jpg',
          },
        },
        ready: () => undefined,
        expand: () => undefined,
      },
    };

    expect(telegramProfile()).toEqual({
      telegramId: 123456,
      firstName: 'Kimal',
      lastName: 'A',
      username: 'kkhalmetov',
      photoUrl: 'https://t.me/i/userpic/320/avatar.jpg',
      locale: 'kk',
      isTelegram: true,
    });
  });

  it('returns a browser fallback when Telegram data is unavailable', () => {
    expect(telegramProfile()).toEqual({ telegramId: undefined, firstName: '', lastName: '', username: '', photoUrl: '', locale: 'ru', isTelegram: false });
  });
});

describe('Telegram links', () => {
  it('uses the Mini App API when available', () => {
    const openTelegramLinkMock = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed', version: '6.1', ready: vi.fn(), expand: vi.fn(), openTelegramLink: openTelegramLinkMock,
      },
    };

    openTelegramLink('https://t.me/kkhalmetov');

    expect(openTelegramLinkMock).toHaveBeenCalledWith('https://t.me/kkhalmetov');
  });

  it('falls back to a new browser tab outside Telegram', () => {
    delete window.Telegram;
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    openTelegramLink('https://t.me/kkhalmetov');

    expect(open).toHaveBeenCalledWith('https://t.me/kkhalmetov', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('opens external map links through the Mini App API', () => {
    const openLink = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed', version: '6.1', ready: vi.fn(), expand: vi.fn(), openLink,
      },
    };

    openExternalLink('https://www.google.com/maps/dir/?api=1');

    expect(openLink).toHaveBeenCalledWith('https://www.google.com/maps/dir/?api=1');
  });
});

describe('Telegram version compatibility', () => {
  it('does not call Bot API 6.1 methods in a 6.0 client', () => {
    const setHeaderColor = vi.fn();
    const setBackgroundColor = vi.fn();
    const impactOccurred = vi.fn();
    const isVersionAtLeast = vi.fn(() => false);
    window.Telegram = {
      WebApp: {
        initData: 'signed',
        version: '6.0',
        isVersionAtLeast,
        ready: vi.fn(),
        expand: vi.fn(),
        setHeaderColor,
        setBackgroundColor,
        HapticFeedback: { impactOccurred, notificationOccurred: vi.fn() },
      },
    };

    prepareTelegram();
    haptic('tap');

    expect(setHeaderColor).not.toHaveBeenCalled();
    expect(setBackgroundColor).not.toHaveBeenCalled();
    expect(impactOccurred).not.toHaveBeenCalled();
    expect(isVersionAtLeast).toHaveBeenCalledWith('6.1');
  });

  it('uses a theme header color before custom colors are supported', () => {
    const setHeaderColor = vi.fn();
    const setBackgroundColor = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed',
        version: '6.1',
        ready: vi.fn(),
        expand: vi.fn(),
        setHeaderColor,
        setBackgroundColor,
      },
    };

    prepareTelegram();

    expect(setHeaderColor).toHaveBeenCalledWith('bg_color');
    expect(setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('configures the custom header color in clients supporting Bot API 6.9', () => {
    const setHeaderColor = vi.fn();
    const setBackgroundColor = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed',
        version: '6.9',
        ready: vi.fn(),
        expand: vi.fn(),
        setHeaderColor,
        setBackgroundColor,
      },
    };

    prepareTelegram();

    expect(setHeaderColor).toHaveBeenCalledWith('#0d4f45');
    expect(setBackgroundColor).toHaveBeenCalledWith('#ffffff');
  });

  it('configures the Telegram bottom bar in clients supporting Bot API 7.10', () => {
    const setBottomBarColor = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed', version: '7.10', ready: vi.fn(), expand: vi.fn(), setBottomBarColor,
      },
    };

    prepareTelegram();

    expect(setBottomBarColor).toHaveBeenCalledWith('#ffffff');
  });

  it('protects an in-progress checkout from accidental closing', () => {
    const enableClosingConfirmation = vi.fn();
    const disableClosingConfirmation = vi.fn();
    window.Telegram = {
      WebApp: {
        initData: 'signed', version: '6.2', ready: vi.fn(), expand: vi.fn(),
        enableClosingConfirmation, disableClosingConfirmation,
      },
    };

    setTelegramClosingConfirmation(true);
    setTelegramClosingConfirmation(false);

    expect(enableClosingConfirmation).toHaveBeenCalledOnce();
    expect(disableClosingConfirmation).toHaveBeenCalledOnce();
  });
});
