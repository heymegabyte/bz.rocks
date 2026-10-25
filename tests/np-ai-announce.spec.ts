import { test, expect, type Page } from '@playwright/test';

// WCAG 2.1 SC 4.1.3 (Status Messages) — the now-playing panel's grounded AI reads
// (liner / meaning / wisdom) load ~1-3s AFTER the panel opens. A screen-reader
// user who already explored the panel would never learn the insights arrived.
// A polite, always-present (sr-only, NOT display:none) live region #npPanelAiStatus
// announces ONCE per track when the first async read lands. This asserts the region
// is a correct live region AND gets populated when the AI content loads.
// (A fresh page has an empty client-side memo, so the loaders take the async FETCH
//  path — which fires the announcement — making this deterministic.)
const BASE = process.env.PROD_URL || 'https://bz.rocks';

const ALBUM = 'signals';
const TRACK = 'bermuda-prophecy';
const TITLE = 'Bermuda Prophecy';

async function openNowPlaying(page: Page) {
  await page.goto(`${BASE}/${ALBUM}/${TRACK}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#transportNpTitle')).toHaveText(TITLE, { timeout: 15000 });
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.locator('#transportNpCover').evaluate((el: HTMLElement) => el.click());
}

test.describe('np-panel async AI insights — SR live-region announcement', () => {
  test('a polite live region announces when the AI reads load (WCAG 4.1.3)', async ({ page }) => {
    await openNowPlaying(page);
    const status = page.locator('#npPanelAiStatus');
    // The region exists + is a correct status live region (present before content).
    await expect(status).toHaveCount(1);
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    // When the first async AI read lands, the region is populated (the announcement).
    await expect(status).toHaveText(/AI insights.*loaded/i, { timeout: 30000 });
    // It is sr-only (clipped to ~1px) — in the a11y tree but never a visible UI element.
    const box = await status.boundingBox();
    expect(box && box.width <= 2 && box.height <= 2).toBe(true);
  });
});
