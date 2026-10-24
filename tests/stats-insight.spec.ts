import { test, expect } from '@playwright/test';

// /stats (server-rendered "by the numbers"): fast cold render (parallel KV
// reads), the 4 total cards + a Most-Played table, and a grounded, crawlable AI
// "state of the catalog" read injected when the KV cache is warm. Runs on PROD.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('/stats page', () => {
  test('renders totals + most-played, with a grounded AI read when warm', async ({ page }) => {
    const resp = await page.goto(`${BASE}/stats`, { waitUntil: 'domcontentloaded' });
    expect(resp?.status()).toBe(200);

    await expect(page.locator('.grid .card')).toHaveCount(4);
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    // The AI "state of the catalog" read is SSR (crawlable). Present once the KV
    // cache warms; fail-soft absent on a cold cache — assert content when there.
    const ai = page.locator('.ai-read');
    if (await ai.count()) {
      expect((await ai.innerText()).trim().length).toBeGreaterThan(20);
    }
  });
});
