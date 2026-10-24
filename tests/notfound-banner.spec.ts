import { test, expect } from '@playwright/test';

// Soft-404 UX: the worker serves the SPA shell with a 404 status +
// window.__IS_404 on a mistyped/retired URL; the SPA shows a dismissible
// "page not found — you're on the player" banner instead of silently showing
// the homepage. Known routes never show it. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('friendly 404 banner', () => {
  test('an unknown route shows the dismissible 404 banner', async ({ page }) => {
    await page.goto(`${BASE}/this-is-not-a-real-page-xyz`, { waitUntil: 'domcontentloaded' });
    const banner = page.locator('.notfound-banner');
    await expect(banner).toBeVisible({ timeout: 8000 });
    await expect(banner).toContainText(/player/i);
    await banner.locator('.notfound-banner__x').click();
    await expect(page.locator('.notfound-banner')).toHaveCount(0, { timeout: 2000 });
  });

  test('known routes never show the 404 banner', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('.notfound-banner')).toHaveCount(0);
  });
});
