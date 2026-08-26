import { afterEach, describe, expect, it } from 'vitest';
import { prepareTelegram, telegramProfile } from '../lib/telegram';

describe('Telegram profile adapter', () => {
  afterEach(() => {
    delete window.Telegram;
    document.documentElement.style.removeProperty('--algan-telegram-content-top');
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
      photoUrl: 'https://t.me/i/userpic/320/avatar.jpg',
      locale: 'kk',
      isTelegram: true,
    });
  });

  it('returns a browser fallback when Telegram data is unavailable', () => {
    expect(telegramProfile()).toEqual({ telegramId: undefined, firstName: '', lastName: '', photoUrl: '', locale: 'ru', isTelegram: false });
  });

  it('sets an iOS header fallback when Telegram omits the content safe area', () => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-data',
        platform: 'ios',
        ready: () => undefined,
        expand: () => undefined,
      },
    };

    prepareTelegram();
    expect(document.documentElement.style.getPropertyValue('--algan-telegram-content-top')).toBe('80px');
  });
});
