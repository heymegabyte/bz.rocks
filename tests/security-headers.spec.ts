import { test, expect } from '@playwright/test';

// Every worker-rendered public HTML page must ship the same security-header set
// as the SPA (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-
// Policy, Permissions-Policy). The /stats, /clip, /press, /watch pages build
// their own Response and previously omitted SECURITY_HEADERS — clickjackable +
// MIME-sniffable + no CSP. Request-only (no browser needed). Runs vs PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

for (const [name, path] of [
  ['stats', '/stats'],
  ['clip', '/clip/border-mercy'],
  ['press', '/press/border-mercy'],
  ['watch', '/watch/border-mercy'],
  ['feed', '/feed.xml']
] as const) {
  test(`${name} ships the full security-header set`, async ({ request }) => {
    const r = await request.get(BASE + path);
    expect(r.status(), path).toBe(200);
    const h = r.headers();
    expect(h['x-content-type-options'], `${path} x-content-type-options`).toBe('nosniff');
    expect(h['content-security-policy'], `${path} CSP`).toBeTruthy();
    expect(h['strict-transport-security'], `${path} HSTS`).toContain('max-age=');
    expect(h['referrer-policy'], `${path} referrer-policy`).toBeTruthy();
    // feed.xml is XML (no frame/permissions threat model); the HTML pages must
    // also carry X-Frame-Options + Permissions-Policy + object-src 'none'.
    if (path !== '/feed.xml') {
      expect(h['x-frame-options'], `${path} x-frame-options`).toBeTruthy();
      expect(h['permissions-policy'], `${path} permissions-policy`).toBeTruthy();
      expect(h['content-security-policy']).toContain("object-src 'none'");
    }
  });
}
