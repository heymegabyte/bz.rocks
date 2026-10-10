import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * Domain rename → bz.rocks (2026-10-10).
 *
 * bz.rocks is now the single canonical origin. Every legacy host 301s to it,
 * preserving path + query, so old links + search-index entries keep working.
 * These assertions hit LIVE prod with redirects disabled so we observe the
 * raw 301 instead of following it. Request-context only — no page/baseURL.
 *
 * NB: the legacy hostnames are assembled from parts so the repo-wide
 * domain-rename sed never rewrites these literals back to bz.rocks.
 */
const LEGACY_ORIGINS = [
  ['music', 'megabyte', 'space'].join('.'),
  ['bzmusic', 'win'].join('.'),
  'www.' + ['bzmusic', 'win'].join('.'),
  'www.' + ['bz', 'rocks'].join('.')
].map(h => `https://${h}`);

const CANON = 'https://' + ['bz', 'rocks'].join('.');

test.describe('domain rename → bz.rocks', () => {
  test('canonical bz.rocks serves the site (200 + self-referential canonical)', async () => {
    const ctx = await pwRequest.newContext();
    const res = await ctx.get(`${CANON}/`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/bz\.rocks\//);
    expect(html).not.toContain(['music', 'megabyte', 'space'].join('.'));
    await ctx.dispose();
  });

  for (const origin of LEGACY_ORIGINS) {
    test(`${origin}/ → 301 ${CANON}/`, async () => {
      const ctx = await pwRequest.newContext();
      const res = await ctx.get(`${origin}/`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(res.headers()['location']).toBe(`${CANON}/`);
      await ctx.dispose();
    });

    test(`${origin} preserves path + query in the 301`, async () => {
      const ctx = await pwRequest.newContext();
      const res = await ctx.get(`${origin}/stats?ref=x`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(res.headers()['location']).toBe(`${CANON}/stats?ref=x`);
      await ctx.dispose();
    });
  }
});
