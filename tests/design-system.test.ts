import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('Algan design system', () => {
  it('keeps application markup free of raw hex colors', () => {
    const sources = [
      'app/app-client.tsx',
      'components/algan-logo.tsx',
      'components/location-map.tsx',
    ].map((path) => readFileSync(resolve(root, path), 'utf8'));

    expect(sources.join('\n')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('declares the semantic tokens used by the interface', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const requiredTokens = [
      '--color-brand',
      '--color-accent',
      '--color-surface',
      '--color-ink',
      '--color-border',
      '--radius-control',
      '--radius-card',
      '--radius-sheet',
      '--shadow-card',
      '--shadow-floating',
    ];

    for (const token of requiredTokens) expect(css).toContain(token);
  });

  it('documents the rules for extending the interface', () => {
    const guide = readFileSync(resolve(root, 'DESIGN.md'), 'utf8');

    expect(guide).toContain('## Tokens');
    expect(guide).toContain('## Components');
    expect(guide).toContain('new raw hex values are not allowed');
  });
});
