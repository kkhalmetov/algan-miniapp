import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticateTelegram, currentAccessToken } from '../lib/api';

describe('Telegram auth contract', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DATA_MODE;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it('sends raw initData using the backend field name', async () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'api';
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test/';
    window.Telegram = {
      WebApp: {
        initData: 'query_id=AAH&hash=test',
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'access.jwt' }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await authenticateTelegram();

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/auth/telegram', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ init_data: 'query_id=AAH&hash=test' }),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }));
    expect(currentAccessToken()).toBe('access.jwt');
    expect(sessionStorage.getItem('algan_access_token')).toBeNull();
  });

  it('refuses to send Telegram initData over insecure HTTP', async () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'api';
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.example.test';
    window.Telegram = {
      WebApp: {
        initData: 'query_id=AAH&hash=test',
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(authenticateTelegram()).rejects.toThrow('clean HTTPS URL');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(currentAccessToken()).toBeUndefined();
  });

  it('rejects malformed authentication responses', async () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'api';
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    window.Telegram = {
      WebApp: {
        initData: 'query_id=AAH&hash=test',
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: '' }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    await expect(authenticateTelegram()).rejects.toThrow('response is invalid');

    expect(currentAccessToken()).toBeUndefined();
  });
});
