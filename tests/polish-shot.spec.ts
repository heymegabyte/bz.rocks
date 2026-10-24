import { test, expect, type Page } from '@playwright/test';

// Throwaway capture harness for the POLISH-PASS gorgeous sweep — scrolls a
// non-featured album card into view so screenshot:'on' captures it for review.
// Also a lightweight render smoke check.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(700);
}

test('album card', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const card = page.locator('.album[data-album]').nth(2);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await expect(card).toBeVisible();
});
