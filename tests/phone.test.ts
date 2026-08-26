import { describe, expect, it } from 'vitest';
import { formatKazakhstanPhoneInput, normalizeKazakhstanPhone } from '../lib/phone';

describe('Kazakhstan phone helpers', () => {
  it('normalizes common Kazakhstan phone formats', () => {
    expect(normalizeKazakhstanPhone('+7 700 123 45 67')).toBe('+77001234567');
    expect(normalizeKazakhstanPhone('8 (700) 123-45-67')).toBe('+77001234567');
    expect(normalizeKazakhstanPhone('7001234567')).toBe('+77001234567');
  });

  it('rejects incomplete and unsupported numbers', () => {
    expect(normalizeKazakhstanPhone('+7 700 123')).toBeNull();
    expect(normalizeKazakhstanPhone('+1 202 555 0100')).toBeNull();
  });

  it('formats input without exceeding eleven digits', () => {
    expect(formatKazakhstanPhoneInput('+77059768000')).toBe('+7 705 976 80 00');
    expect(formatKazakhstanPhoneInput('87001234567')).toBe('+7 700 123 45 67');
    expect(formatKazakhstanPhoneInput('7001234567')).toBe('+7 700 123 45 67');
    expect(formatKazakhstanPhoneInput('+7 700 123 45 6789')).toBe('+7 700 123 45 67');
  });
});
