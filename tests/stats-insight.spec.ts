import { test, expect } from '@playwright/test';

// /stats (server-rendered "by the numbers"): fast cold render (parallel KV
// reads), the 4 total cards + a Most-Played table, and a grounded AI "state of
// the catalog" read (Workers AI 70B, KV-cached). The read is now served
// CLIENT-SIDE via GET /api/stats-insight so it's ALWAYS FRESH — bypassing the
// ≤4h HTML edge cache that used to blank it for whole windows. Runs on PROD.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('/stats page', () => {
  test('renders totals + most-played table', async ({ page }) => {
    const resp = await page.goto(`${BASE}/stats`, { waitUntil: 'domcontentloaded' });
    expect(resp?.status()).toBe(200);
    await expect(page.locator('.grid .card')).toHaveCount(4);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
  });

  test('GET /api/stats-insight returns a typed insight string', async ({ request }) => {
    const r = await request.get(`${BASE}/api/stats-insight`);
    expect(r.status()).toBe(200);
    const body = (await r.json()) as { insight?: unknown };
    expect(typeof body.insight).toBe('string');
  });

  test('the AI read is filled client-side from the live endpoint (always-fresh)', async ({ page, request }) => {
    const live =
      ((await (await request.get(`${BASE}/api/stats-insight`)).json()) as { insight?: string }).insight ?? '';
    await page.goto(`${BASE}/stats`, { waitUntil: 'domcontentloaded' });
    // The slot is ALWAYS present now (container renders hidden when empty).
    const slot = page.locator('[data-stats-insight]');
    await expect(slot).toHaveCount(1);
    test.skip(live.trim().length === 0, 'KV insight cold this run — nothing to display');
    // The client fetch fills .ai-read-text + unhides the slot.
    await expect(slot).toBeVisible({ timeout: 10000 });
    await expect(slot.locator('.ai-read-text')).toHaveText(/\S/, { timeout: 10000 });
    await expect(slot).toContainText(/AI read/);
  });
});
