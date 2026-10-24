import { test, expect, type Page } from '@playwright/test';

// Throwaway capture harness for the POLISH-PASS sweep — loads the homepage so
// screenshot:'on' captures the Aeon's Choice rail (top-left) for review.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(1200);
}

test('aeon rail', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await expect(page.locator('#aiPlaylist')).toBeVisible();
});
