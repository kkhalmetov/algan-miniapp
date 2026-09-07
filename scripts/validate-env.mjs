import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = process.cwd();
const liveSourceFiles = [
  'app/app-client.tsx',
  'components/algan/checkout.tsx',
  'components/algan/marketplace.tsx',
  'components/algan/orders.tsx',
  'lib/store.ts',
];

function cleanHttpsUrl(name, rawValue, errors, required = false) {
  const value = rawValue?.trim();
  if (!value) {
    if (required) errors.push(`${name} is required`);
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      errors.push(`${name} must be a clean HTTPS URL`);
      return undefined;
    }
    return url;
  } catch {
    errors.push(`${name} must be a valid URL`);
    return undefined;
  }
}

/** @param {Record<string, string | undefined>} env */
export function validateEnvironment(env = process.env) {
  const errors = [];
  const warnings = [];
  const dataMode = env.NEXT_PUBLIC_DATA_MODE?.trim() || 'mock';
  const releaseMode = env.NEXT_PUBLIC_RELEASE_MODE?.trim() || 'demo';

  if (!['mock', 'api'].includes(dataMode)) {
    errors.push('NEXT_PUBLIC_DATA_MODE must be mock or api');
  }
  if (!['demo', 'live'].includes(releaseMode)) {
    errors.push('NEXT_PUBLIC_RELEASE_MODE must be demo or live');
  }

  const appOrigin = cleanHttpsUrl(
    'NEXT_PUBLIC_APP_ORIGIN',
    env.NEXT_PUBLIC_APP_ORIGIN,
    errors,
    releaseMode === 'live',
  );
  if (!appOrigin) warnings.push('NEXT_PUBLIC_APP_ORIGIN is not set; using the application fallback');
  const apiUrl = cleanHttpsUrl(
    'NEXT_PUBLIC_API_BASE_URL',
    env.NEXT_PUBLIC_API_BASE_URL,
    errors,
    dataMode === 'api' || releaseMode === 'live',
  );

  if (releaseMode === 'demo' && dataMode !== 'mock') {
    warnings.push('Demo release is configured to use the API');
  }

  if (releaseMode === 'live') {
    if (dataMode !== 'api') errors.push('Live release requires NEXT_PUBLIC_DATA_MODE=api');
    if (!apiUrl) errors.push('Live release requires a production API URL');

    const mockImports = liveSourceFiles.filter((path) =>
      readFileSync(resolve(projectRoot, path), 'utf8').includes("/mock-data'"),
    );
    if (mockImports.length > 0) {
      errors.push(`Live release still imports mock data: ${mockImports.join(', ')}`);
    }

    const legalCore = readFileSync(resolve(projectRoot, 'lib/legal-core.ts'), 'utf8');
    if (!legalCore.includes("type PublishedLegalDocument = 'terms' | 'personalDataConsent' | 'privacy' | 'orderRules' | 'publicOffer'")) {
      errors.push('Live release requires published order rules and public offer');
    }

    const payment = readFileSync(resolve(projectRoot, 'lib/payment.ts'), 'utf8');
    if (payment.includes('MOCK_FAILURE_PARAM')) {
      errors.push('Live release still uses the mock payment flow');
    }
  }

  return { errors, warnings, config: { dataMode, releaseMode } };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  const result = validateEnvironment();
  result.warnings.forEach((warning) => console.warn(`[env] ${warning}`));
  if (result.errors.length > 0) {
    result.errors.forEach((error) => console.error(`[env] ${error}`));
    process.exit(1);
  }
  console.log(`[env] ${result.config.releaseMode} release with ${result.config.dataMode} data validated`);
}
