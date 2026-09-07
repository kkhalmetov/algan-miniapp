import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../scripts/validate-env.mjs';

describe('production release gates', () => {
  it('accepts the explicitly identified demo release', () => {
    const result = validateEnvironment({
      NEXT_PUBLIC_APP_ORIGIN: 'https://algan-bot.online',
      NEXT_PUBLIC_DATA_MODE: 'mock',
      NEXT_PUBLIC_RELEASE_MODE: 'demo',
    });

    expect(result.errors).toEqual([]);
    expect(result.config).toEqual({ dataMode: 'mock', releaseMode: 'demo' });
  });

  it('blocks a live release while customer data and payment still use mocks', () => {
    const result = validateEnvironment({
      NEXT_PUBLIC_APP_ORIGIN: 'https://algan-bot.online',
      NEXT_PUBLIC_API_BASE_URL: 'https://api.algan-bot.online',
      NEXT_PUBLIC_DATA_MODE: 'api',
      NEXT_PUBLIC_RELEASE_MODE: 'live',
    });

    expect(result.errors).toContainEqual(expect.stringContaining('still imports mock data'));
    expect(result.errors).toContain('Live release requires published order rules and public offer');
    expect(result.errors).toContain('Live release still uses the mock payment flow');
  });

  it('rejects unsafe public URLs', () => {
    const result = validateEnvironment({
      NEXT_PUBLIC_APP_ORIGIN: 'http://localhost:3000',
      NEXT_PUBLIC_DATA_MODE: 'invalid',
      NEXT_PUBLIC_RELEASE_MODE: 'demo',
    });

    expect(result.errors).toContain('NEXT_PUBLIC_DATA_MODE must be mock or api');
    expect(result.errors).toContain('NEXT_PUBLIC_APP_ORIGIN must be a clean HTTPS URL');
  });

  it('smoke-tests the activated commit and required security headers', () => {
    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
    const pullRequestWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
    const productionSmokeWorkflow = readFileSync('.github/workflows/production-smoke.yml', 'utf8');

    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('release.json');
    expect(workflow).toContain('rolling back');
    expect(workflow).toContain('content-security-policy');
    expect(workflow).toContain("release_root='/var/www/algan-miniapp/releases'");
    expect(workflow).toContain("[[ \"$release_name\" =~ ^[0-9a-f]{40}$ ]]");
    expect(workflow).toContain('NR > 5');
    expect(pullRequestWorkflow).toContain('pull_request:');
    expect(pullRequestWorkflow).toContain('npm run build');
    expect(productionSmokeWorkflow).toContain('schedule:');
    expect(productionSmokeWorkflow).toContain('$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/commits/main');
    expect(productionSmokeWorkflow).toContain('.commit == $sha');
    expect(productionSmokeWorkflow).toContain('.well-known/security.txt');
    expect(productionSmokeWorkflow).toContain('content-security-policy');
  });

  it('ships Telegram and web discovery metadata', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8');
    const css = readFileSync('app/globals.css', 'utf8');
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as { start_url?: string; display?: string };
    const security = readFileSync('public/.well-known/security.txt', 'utf8');

    expect(layout).toContain('strategy="beforeInteractive"');
    expect(layout).toContain('https://telegram.org/js/telegram-web-app.js');
    expect(css).toContain('var(--tg-viewport-stable-height, 100dvh)');
    expect(css).toContain('var(--tg-content-safe-area-inset-bottom, 0px)');
    expect(manifest).toMatchObject({ start_url: '/', display: 'standalone' });
    expect(security).toContain('Contact: mailto:algansupport@gmail.com');
  });
});
