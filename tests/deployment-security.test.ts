import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const bootstrap = readFileSync('deploy/bootstrap-vps.sh', 'utf8');

describe('production security configuration', () => {
  it('installs browser security headers', () => {
    expect(bootstrap).toContain('Content-Security-Policy');
    expect(bootstrap).toContain('Strict-Transport-Security');
    expect(bootstrap).toContain('X-Content-Type-Options');
    expect(bootstrap).toContain('frame-ancestors');
  });

  it('includes security headers in every cache-policy location', () => {
    const productionNginx = bootstrap.split('<<NGINX_HTTPS')[1] ?? '';
    const locations = [...productionNginx.matchAll(/location [^{]+ \{([\s\S]*?)\n    }/g)]
      .map((match) => match[1])
      .filter((location) => location.includes('add_header Cache-Control'));

    expect(locations).toHaveLength(3);
    locations.forEach((location) => {
      expect(location).toContain('include /etc/nginx/snippets/algan-security-headers.conf;');
    });
  });
});
