import { test, expect, type Page } from '@playwright/test';

// Throwaway capture harness for the POLISH-PASS sweep — loads the homepage and,
// with screenshot:'on' (flipped on only while reviewing), captures the current
// surface. Also a lightweight homepage render smoke check.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(900);
}

test('homepage renders', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('#albums')).toBeVisible();
});
