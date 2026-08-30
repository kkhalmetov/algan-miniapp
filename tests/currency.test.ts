import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchKztToRubRate, formatCurrency, KZT_RUB_RATE_URL } from '../lib/currency';

describe('currency display', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('converts tenge prices to rounded rubles', () => {
    expect(formatCurrency(2490, 'ru', 'RUB', 0.185297)).toBe('461 ₽');
    expect(formatCurrency(2490, 'kk', 'KZT')).toBe('2\u00a0490 ₸');
  });

  it('loads and validates the current KZT to RUB rate', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 'success', rates: { RUB: 0.185297 } }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchKztToRubRate()).resolves.toBe(0.185297);
    expect(fetchMock).toHaveBeenCalledWith(KZT_RUB_RATE_URL, { signal: undefined });
  });

  it('rejects an invalid exchange-rate response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: 'error', rates: {} }) }));
    await expect(fetchKztToRubRate()).rejects.toThrow('invalid');
  });
});
