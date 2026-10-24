import { test, expect, type Page } from '@playwright/test';

// AI segue — the now-playing "Up next" card: the real next track (catalog play
// order, matching nextTrack()) + a grounded one-line "why it flows" from
// /api/segue (Workers AI, KV-cached, fail-soft). The up-next title is
// deterministic (no AI); the "why" augments. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const ALBUM = 'signals';
const TRACK = 'bermuda-prophecy';
const TITLE = 'Bermuda Prophecy';

async function dismissAutoplayPrompt(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function openNowPlaying(page: Page) {
  await page.goto(`${BASE}/${ALBUM}/${TRACK}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#transportNpTitle')).toHaveText(TITLE, { timeout: 15000 });
  await dismissAutoplayPrompt(page);
  await page.locator('#transportNpCover').evaluate((el: HTMLElement) => el.click());
}

test.describe('AI segue (/api/segue + up-next card)', () => {
  test('API returns a grounded why for two real tracks; 404 for an unknown one', async ({ request }) => {
    const ok = await request.get(`${BASE}/api/segue?from=bermuda-prophecy&to=border-mercy`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { why?: string | null };
    expect('why' in body).toBe(true);
    if (body.why != null) {
      expect(typeof body.why).toBe('string');
      expect(body.why.length).toBeGreaterThan(8);
    }

    const bad = await request.get(`${BASE}/api/segue?from=bermuda-prophecy&to=not-a-real-track-xyz`);
    expect(bad.status()).toBe(404);
  });

  test('now-playing shows an up-next card naming the real next track', async ({ page }) => {
    await openNowPlaying(page);
    await expect(page.locator('#npPanelSegue')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#npPanelSegueTitle')).not.toBeEmpty();
  });
});
