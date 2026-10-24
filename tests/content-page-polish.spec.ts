import { test, expect } from '@playwright/test';

// Content-page polish: the Print button was removed (also killed a javascript:
// CSP smell), and the /press "press kit" claim is now backed by a real,
// reachable request CTA (per frontend-judgeable-no-orphan-code). Runs on PROD.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.describe('content page polish', () => {
  test('no Print button on content pages', async ({ page }) => {
    await page.goto(`${BASE}/press`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#contentpageTitle')).not.toBeEmpty({ timeout: 15000 });
    await expect(page.locator('.contentpage__share--print')).toHaveCount(0);
    await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  });

  test('/press surfaces a real, reachable press-kit request CTA', async ({ page }) => {
    await page.goto(`${BASE}/press`, { waitUntil: 'domcontentloaded' });
    const cta = page.locator('.press-kit-cta a');
    await expect(cta).toBeVisible({ timeout: 15000 });
    await expect(cta).toHaveAttribute('href', /^mailto:[^?]*@/);
  });
});
