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
  it('ships the smiling food-box identity in standalone and horizontal lockups', () => {
    const mark = readFileSync(resolve(root, 'public/algan-mark.svg'), 'utf8');
    const wordmark = readFileSync(resolve(root, 'public/algan-wordmark.svg'), 'utf8');
    const logo = readFileSync(resolve(root, 'public/algan-logo.svg'), 'utf8');
    const lightLogo = readFileSync(resolve(root, 'public/algan-logo-light.svg'), 'utf8');

    expect(mark).toContain('smile-cut');
    expect(wordmark).toContain('viewBox="0 0 170 56"');
    expect(logo).toContain('#0D4F45');
    expect(lightLogo).toContain('#CBEF69');
  });

  it('keeps application markup free of raw hex colors', () => {
    const sources = ['app', 'components', 'lib']
      .flatMap(sourceFiles)
      .filter((path) => path !== 'lib/design-tokens.ts')
      .map((path) => readFileSync(resolve(root, path), 'utf8'));

    expect(sources.join('\n')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('declares the semantic tokens used by the interface', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const layout = readFileSync(resolve(root, 'app/layout.tsx'), 'utf8');
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
      '--motion-slow',
      '--ease-standard',
    ];

    for (const token of requiredTokens) expect(css).toContain(token);
    expect(layout).toContain("import './fonts.css'");
    expect(css).toContain('--font-sans: "Onest Variable", sans-serif');
  });

  it('documents the rules for extending the interface', () => {
    const guide = readFileSync(resolve(root, 'DESIGN.md'), 'utf8');

    expect(guide).toContain('## Foundations and tokens');
    expect(guide).toContain('## Components');
    expect(guide).toMatch(/new raw hex values are not allowed/i);
    expect(guide).toContain('components/ui-kit.tsx');
    expect(guide).toContain('## Governance');
  });

  it('routes shared controls through the UI kit', () => {
    const app = [
      'app/app-client.tsx',
      ...sourceFiles('components/algan'),
    ].map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');

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
    expect(app).not.toMatch(/(?:max-)?h-\[(?:82|92)dvh\]/);
    expect(app).not.toContain("style={{ backgroundColor:");
    expect(app).not.toContain('!min-h-14');
    expect(app).not.toContain('window.confirm');
    expect(app).not.toContain('description=""');
    expect(app).not.toContain('role="dialog"');
    expect(app).not.toContain('<SheetHandle');
    expect(app).not.toContain('text-white/65');
    expect(app).not.toContain('new Intl.DateTimeFormat');
    expect(app).not.toContain('grid shrink-0 place-items-center overflow-hidden rounded-full bg-highlight');
    expect(app).not.toContain('px-page pb-[max(1.25rem,env(safe-area-inset-bottom))]');
    expect(app).toContain('<AvatarFrame');
    expect(app).toContain('<ScrollArea');
    expect(app.match(/overflow-y-auto/g)).toHaveLength(1);
  });

  it('uses the primary Kazakh document language and keeps it synchronized at runtime', () => {
    const layout = readFileSync(resolve(root, 'app/layout.tsx'), 'utf8');
    const checkout = readFileSync(resolve(root, 'components/algan/checkout.tsx'), 'utf8');

    expect(layout).toContain('<html lang="kk">');
    expect(readFileSync(resolve(root, 'hooks/use-app-runtime.ts'), 'utf8')).toContain('document.documentElement.lang = locale');
    expect(checkout).toContain('aria-busy={paymentPending}');
    expect(layout).not.toContain('спасаем еду');
  });

  it('keeps the application entry point focused on orchestration', () => {
    const app = readFileSync(resolve(root, 'app/app-client.tsx'), 'utf8');

    expect(app.split('\n').length).toBeLessThan(350);
    expect(app).not.toContain("from '@/components/ui-kit'");
    expect(app).not.toMatch(/^function\s+(?:HomeTab|OrdersTab|ProfileTab|BoxDetails|CartSheet)/m);
  });

  it('keeps runtime platform colors aligned with CSS tokens', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const runtime = readFileSync(resolve(root, 'lib/design-tokens.ts'), 'utf8');

    expect(css).toContain('--color-brand: #0d4f45');
    expect(css).toContain('--color-surface: #ffffff');
    expect(runtime).toContain("BRAND_COLOR = '#0d4f45'");
    expect(runtime).toContain("APP_SURFACE_COLOR = '#ffffff'");
  });

  it('does not reset component typography with a global font shorthand', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');

    expect(css).not.toMatch(/button\s*,\s*input\s*\{\s*font\s*:/);
    expect(css).toContain('button, input, textarea, select { font-family: inherit; }');
  });

  it('keeps secondary text tokens readable on interface surfaces', () => {
    const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    const color = (token: string) => css.match(new RegExp(`${token}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1] ?? '';
    const luminance = (hex: string) => {
      const channels = hex.match(/[0-9a-f]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
      const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };
    const contrast = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0]! + 0.05) / (values[1]! + 0.05);
    };
    const foregroundTokens = ['--color-ink-secondary', '--color-ink-muted', '--color-ink-subtle'];
    const surfaceTokens = ['--color-surface', '--color-panel', '--color-surface-soft', '--color-surface-muted', '--color-brand-pale'];
    const semanticPairs = [
      ['--color-accent-strong', '--color-accent-soft'],
      ['--color-danger', '--color-danger-soft'],
      ['--color-warning-ink', '--color-warning-surface'],
      ['--color-allergen-ink', '--color-allergen-surface'],
      ['--color-allergen-body', '--color-allergen-surface'],
    ];

    for (const foreground of foregroundTokens) {
      for (const surface of surfaceTokens) expect(contrast(color(foreground), color(surface))).toBeGreaterThanOrEqual(4.5);
    }
    for (const [foreground, surface] of semanticPairs) {
      expect(contrast(color(foreground), color(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
