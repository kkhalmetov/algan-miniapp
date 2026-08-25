import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const vinextCli = fileURLToPath(new URL('../node_modules/vinext/dist/cli.js', import.meta.url));
const result = spawnSync(process.execPath, [vinextCli, 'build'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  encoding: 'utf8',
});

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const windowsShutdownBug =
  process.platform === 'win32' &&
  output.includes('Build complete.') &&
  output.includes('UV_HANDLE_CLOSING') &&
  existsSync(fileURLToPath(new URL('../dist/client/index.html', import.meta.url)));

if (windowsShutdownBug) {
  console.warn('[algan] Vinext completed the export; ignored its known Windows shutdown assertion.');
  process.exit(0);
}

process.exit(result.status ?? 1);
