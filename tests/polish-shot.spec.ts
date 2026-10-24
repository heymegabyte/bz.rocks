import { test, expect, type Page } from '@playwright/test';

// Throwaway capture harness for the POLISH-PASS gorgeous sweep — loads the
// homepage, dismisses the autoplay prompt, and lets screenshot:'on' capture the
// masthead/hero for visual review. Also a lightweight render smoke check.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(900);
}

test('homepage masthead + hero', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('#albums')).toBeVisible();
});
