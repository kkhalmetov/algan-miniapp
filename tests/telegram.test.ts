import { afterEach, describe, expect, it } from 'vitest';
import { telegramProfile } from '../lib/telegram';

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
      firstName: 'Kimal',
      lastName: 'A',
      photoUrl: 'https://t.me/i/userpic/320/avatar.jpg',
      locale: 'kk',
      isTelegram: true,
    });
  });

  it('returns a browser fallback when Telegram data is unavailable', () => {
    expect(telegramProfile()).toEqual({ firstName: '', lastName: '', photoUrl: '', locale: 'ru', isTelegram: false });
  });
});
