import { test, expect } from '@playwright/test';

// The cinematic hero title (#heroTitle, -webkit-line-clamp:2) must FIT every
// title without a mid-phrase ellipsis. A long album name ("Signals From The
// Other Side") used to clip to "SIGNALS FROM THE…" on desktop because the font
// was fixed-huge; now --hero-scale shrinks long titles (short ones stay huge).
// A truncated clamped element has scrollHeight > clientHeight. Runs on PROD via
// system Chrome (playwright.chrome.config.ts).

async function heroInfo(page: import('@playwright/test').Page) {
  return page.locator('#heroTitle').evaluate(el => ({
    text: (el.textContent || '').trim(),
    fontPx: Math.round(parseFloat(getComputedStyle(el).fontSize)),
    truncated: el.scrollHeight > el.clientHeight + 2
  }));
}

test.describe('hero title fit', () => {
  test('a long album title fills two lines without truncation', async ({ page }) => {
    await page.goto('/signals', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
    const info = await heroInfo(page);
    expect(info.text).toBe('SIGNALS FROM THE OTHER SIDE');
    expect(info.truncated, `hero clipped: "${info.text}"`).toBe(false);
  });

  test('a short title stays large (scale 1), never shrunk', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
    const info = await heroInfo(page);
    expect(info.text).toBe('PRESS PLAY');
    expect(info.truncated).toBe(false);
    // Short titles must remain big + cinematic (not accidentally shrunk).
    expect(info.fontPx).toBeGreaterThan(80);
  });
});
