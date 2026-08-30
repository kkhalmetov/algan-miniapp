import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe('Algan design system', () => {
  it('keeps application markup free of raw hex colors', () => {
    const sources = ['app', 'components', 'lib']
      .flatMap(sourceFiles)
      .filter((path) => path !== 'lib/design-tokens.ts')
      .map((path) => readFileSync(resolve(root, path), 'utf8'));

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
      '--spacing-page',
      '--text-display',
      '--text-page-title',
      '--text-section-title',
      '--shadow-card',
      '--shadow-floating',
      '--motion-fast',
      '--motion-medium',
      '--ease-standard',
    ];

    for (const token of requiredTokens) expect(css).toContain(token);
    expect(css).toContain("url('/fonts/inter-cyrillic-ext-wght-normal.woff2')");
    expect(css).toContain("url('/fonts/inter-cyrillic-wght-normal.woff2')");
    expect(css).toContain("url('/fonts/inter-latin-wght-normal.woff2')");
    expect(css).toContain('--font-sans: "Inter Variable", sans-serif');
  });

  it('documents the rules for extending the interface', () => {
    const guide = readFileSync(resolve(root, 'DESIGN.md'), 'utf8');

    expect(guide).toContain('## Foundations and tokens');
    expect(guide).toContain('## Components');
    expect(guide).toContain('new raw hex values are not allowed');
    expect(guide).toContain('components/ui-kit.tsx');
    expect(guide).toContain('## Governance');
  });

  it('routes shared controls through the UI kit', () => {
    const app = readFileSync(resolve(root, 'app/app-client.tsx'), 'utf8');

    expect(app).toContain("from '@/components/ui-kit'");
    expect(app).not.toContain('className="primary-button');
    expect(app).not.toContain('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted');
    expect(app).not.toContain('text-[30px] font-black tracking-[-0.045em]');
    expect(app).not.toContain('absolute inset-0 z-[1000] flex items-end');
    expect(app).not.toContain('flex min-h-12 w-full items-center justify-center gap-2 border-t border-border');
    expect(app).not.toContain('shrink-0 border-t border-border bg-surface/96');
    expect(app).not.toContain('z-[800] shrink-0 border-t border-border bg-surface/95');
    expect(app).not.toContain('font-extrabold text-brand underline decoration-border-strong');
    expect(app).not.toContain('className="modal-body"');
    expect(app).not.toContain('flex min-h-dvh flex-col justify-center overflow-y-auto');
    expect(app).not.toContain('grid h-8 w-8 shrink-0 place-items-center rounded-full');
    expect(app).not.toContain('rounded-control bg-surface-soft px-4 py-3');
    expect(app).not.toContain('rounded-control border border-allergen-border bg-allergen-surface');
    expect(app).not.toContain('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-pale');
    expect(app).not.toContain('shrink-0 bg-brand px-4 pb-3');
    expect(app).not.toContain('px-7');
    expect(app).not.toContain('window.confirm');
    expect(app).not.toContain('description=""');
    expect(app).not.toContain('role="dialog"');
  });

  it('uses the primary Kazakh document language and keeps it synchronized at runtime', () => {
    const layout = readFileSync(resolve(root, 'app/layout.tsx'), 'utf8');
    const app = readFileSync(resolve(root, 'app/app-client.tsx'), 'utf8');
    const map = readFileSync(resolve(root, 'components/location-map.tsx'), 'utf8');

    expect(layout).toContain('<html lang="kk">');
    expect(app).toContain('document.documentElement.lang = locale');
    expect(app).toContain('aria-busy={paymentPending}');
    expect(map).toContain('role="region"');
    expect(layout).not.toContain('спасаем еду');
  });

  it('keeps runtime platform colors aligned with CSS tokens', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const runtime = readFileSync(resolve(root, 'lib/design-tokens.ts'), 'utf8');

    expect(css).toContain('--color-brand: #1f5c49');
    expect(css).toContain('--color-surface: #fffdf8');
    expect(runtime).toContain("BRAND_COLOR = '#1f5c49'");
    expect(runtime).toContain("APP_SURFACE_COLOR = '#fffdf8'");
  });
});
