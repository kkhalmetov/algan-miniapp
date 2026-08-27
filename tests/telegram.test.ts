import { afterEach, describe, expect, it, vi } from 'vitest';
import { openExternalLink, openTelegramLink, telegramProfile } from '../lib/telegram';

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
        initData: 'signed', ready: vi.fn(), expand: vi.fn(), openTelegramLink: openTelegramLinkMock,
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
        initData: 'signed', ready: vi.fn(), expand: vi.fn(), openLink,
      },
    };

    openExternalLink('https://www.google.com/maps/dir/?api=1');

    expect(openLink).toHaveBeenCalledWith('https://www.google.com/maps/dir/?api=1');
  });
});
