import { test, expect } from '@playwright/test';

// Soft-404 UX: the worker serves the SPA shell with a 404 status +
// window.__IS_404 on a mistyped/retired URL. Instead of a dead-end, the SPA
// shows a dismissible banner — and when the bad URL's slug looks like a real
// track it offers a grounded "did you mean … ▶" one-tap recovery (deterministic
// closest-match first, AI vibe matcher refines in the background). Known routes
// never show it. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('friendly 404 banner', () => {
  test('a gibberish route shows the dismissible 404 banner (no false suggestion)', async ({
    page
  }) => {
    await page.goto(`${BASE}/zzzxqq-wwvvk-nomatch-7f3`, { waitUntil: 'domcontentloaded' });
    const banner = page.locator('.notfound-banner');
    await expect(banner).toBeVisible({ timeout: 8000 });
    await expect(banner).toContainText(/player/i);
    await banner.locator('.notfound-banner__x').click();
    await expect(page.locator('.notfound-banner')).toHaveCount(0, { timeout: 2000 });
  });

  test('an unknown route that looks like a track suggests the REAL track + plays it', async ({
    page
  }) => {
    await page.goto(`${BASE}/bermuda-prophecy-not-a-real-page-xyz`, {
      waitUntil: 'domcontentloaded'
    });
    const banner = page.locator('.notfound-banner');
    await expect(banner).toBeVisible({ timeout: 8000 });
    const suggest = banner.locator('.notfound-banner__suggest');
    await expect(suggest).toBeVisible({ timeout: 6000 });
    // Grounded — the suggestion names a real catalog track (Bermuda Prophecy).
    await expect(suggest).toContainText(/bermuda/i);
    await suggest.click();
    // One-tap recovery actually starts playback of a real track.
    await expect(page.locator('#transportNpTitle')).not.toBeEmpty({ timeout: 8000 });
  });

  test('known routes never show the 404 banner', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('.notfound-banner')).toHaveCount(0);
  });
});
