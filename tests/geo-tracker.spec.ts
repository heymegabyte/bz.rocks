import { test, expect } from '@playwright/test';

// #10 GEO AI-discovery tracker. Detects (server-side) humans ARRIVING from an AI
// answer (AI-host Referer) + AI CRAWLERS fetching the catalog (bot UA), counts
// them in KV, serves aggregated-only JSON at /api/geo, and surfaces an "AI
// discovery" panel on /stats (TT-safe DOM build — /stats enforces Trusted Types).
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('GEO AI-discovery tracker', () => {
  test('/api/geo returns an aggregated, well-formed shape', async ({ request }) => {
    const body = await (await request.get(`${BASE}/api/geo`)).json();
    expect(typeof body.referrers).toBe('object');
    expect(typeof body.bots).toBe('object');
    expect(typeof body.totalReferrals).toBe('number');
    expect(typeof body.totalBotHits).toBe('number');
    expect(body.totalReferrals).toBeGreaterThanOrEqual(0);
    expect(body.totalBotHits).toBeGreaterThanOrEqual(0);
    // freshness is a number (minutes) or null when nothing's been seen yet.
    expect(body.freshnessMin === null || typeof body.freshnessMin === 'number').toBe(true);
    // Aggregated-only — never leaks a per-request identifier (no PII).
    const json = JSON.stringify(body);
    expect(json).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // no raw IP
  });

  test('an AI-referer page request is served normally (detection never breaks the response)', async ({
    request
  }) => {
    const res = await request.get(`${BASE}/?aigeo=${Date.now()}`, {
      headers: { Referer: 'https://chatgpt.com/' }
    });
    expect(res.status()).toBe(200);
  });

  test('/stats surfaces the AI-discovery panel, TT-safe, with no console/CSP errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      if (m.type() === 'error' && !/ERR_ABORTED|blocked by (Playwright|the test)/i.test(m.text())) {
        errors.push(m.text());
      }
    });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await page.goto(`${BASE}/stats`, { waitUntil: 'domcontentloaded' });
    const panel = page.locator('#geoPanel');
    await expect(panel).toBeVisible();
    // The client fetch fills the panel. Prod KV has counts (referrals + bot
    // hits), so the panel resolves to real chips — proving the full pipeline
    // (count → /api/geo → TT-safe DOM render) works. (If counts were ever 0 the
    // honest "measuring…" copy would stand; here we assert the populated path.)
    await expect(panel.locator('.geo-chip').first()).toBeVisible({ timeout: 10000 });
    expect(errors, `console/CSP errors on /stats:\n${errors.join('\n')}`).toEqual([]);
  });
});
