import { existsSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const clientOutput = fileURLToPath(new URL('../dist/client', import.meta.url));
const vinextCli = fileURLToPath(new URL('../node_modules/vinext/dist/cli.js', import.meta.url));
const result = spawnSync(process.execPath, [vinextCli, 'build'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const windowsShutdownBug =
  process.platform === 'win32' &&
  output.includes('Build complete.') &&
  output.includes('UV_HANDLE_CLOSING') &&
  existsSync(`${clientOutput}/index.html`);

if (windowsShutdownBug) {
  console.warn('[algan] Vinext completed the export; ignored its known Windows shutdown assertion.');
}

const buildSucceeded = result.status === 0 || windowsShutdownBug;
if (!buildSucceeded) process.exit(result.status ?? 1);

let commit = process.env.GITHUB_SHA?.trim();
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim();
  } catch {
    commit = 'development';
  }
}

writeFileSync(
  `${clientOutput}/release.json`,
  `${JSON.stringify({
    status: 'ok',
    service: 'algan-miniapp',
    commit,
    releaseMode: process.env.NEXT_PUBLIC_RELEASE_MODE ?? 'demo',
    dataMode: process.env.NEXT_PUBLIC_DATA_MODE ?? 'mock',
  })}\n`,
  'utf8',
);
