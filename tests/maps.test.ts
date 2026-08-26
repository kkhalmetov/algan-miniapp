import { describe, expect, it } from 'vitest';
import { getRouteOptions } from '../lib/maps';

describe('external route links', () => {
  it('builds HTTPS links with destination coordinates for all standard providers', () => {
    const options = getRouteOptions(42.3184, 69.5907, false);

    expect(options.map((option) => option.id)).toEqual(['2gis', 'yandex', 'google']);
    options.forEach((option) => {
      expect(option.url).toMatch(/^https:\/\//);
      expect(decodeURIComponent(option.url)).toContain('42.3184');
      expect(decodeURIComponent(option.url)).toContain('69.5907');
    });
  });

  it('adds Apple Maps only for Apple mobile devices', () => {
    expect(getRouteOptions(42.3184, 69.5907, false).some((option) => option.id === 'apple')).toBe(false);
    expect(getRouteOptions(42.3184, 69.5907, true).find((option) => option.id === 'apple')?.url)
      .toContain('maps.apple.com');
  });
});
