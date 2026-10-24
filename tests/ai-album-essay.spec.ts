import { test, expect } from '@playwright/test';

// AI "about this drop" album essay — a grounded 2-3 sentence read on each album
// (Workers AI, KV-cached, fail-soft), lazily fetched per album card as it
// scrolls into view from /api/album-essay. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const ALBUM = 'signals';

test.describe('AI album essay (/api/album-essay + about-this-drop card)', () => {
  test('API returns a grounded essay for a real album; 404 for an unknown one', async ({ request }) => {
    const ok = await request.get(`${BASE}/api/album-essay?album=${ALBUM}`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { essay?: string | null };
    expect('essay' in body).toBe(true);
    if (body.essay != null) {
      expect(typeof body.essay).toBe('string');
      expect(body.essay.length).toBeGreaterThan(20);
    }

    const bad = await request.get(`${BASE}/api/album-essay?album=not-a-real-album`);
    expect(bad.status()).toBe(404);
  });

  test('album card lazily reveals an about-this-drop essay on scroll', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    // Register before scrolling so an above-the-fold album's fetch isn't missed.
    const respP = page.waitForResponse(r => r.url().includes('/api/album-essay') && r.url().includes(ALBUM), {
      timeout: 30000
    });
    const close = page.locator('#apClose');
    if (await close.isVisible().catch(() => false)) await close.click();

    const drop = page.locator(`[data-album-essay="${ALBUM}"]`);
    await expect(drop).toHaveCount(1);
    // Scroll the always-visible CARD into view (the drop itself starts hidden).
    await page.locator(`.album[data-album="${ALBUM}"]`).scrollIntoViewIfNeeded();

    const essay = ((await respP.then(r => r.json())) as { essay?: string | null }).essay;
    if (essay) {
      await expect(drop).toBeVisible({ timeout: 10000 });
      await expect(drop.locator('.album__drop-body')).not.toBeEmpty();
    } else {
      await expect(drop).toBeHidden();
    }
  });
});
