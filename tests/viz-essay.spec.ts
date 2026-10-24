import { test, expect, type Page } from '@playwright/test';

// Two directives: (1) clicking the BARE visualization cycles the mode (but not
// when a control/HUD is clicked), coexisting with auto-cycle; (2) the album
// "About this drop" essays are collapsed to 2 lines with a Read more/Show less
// toggle. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.waitForTimeout(800);
}

test.describe('viz click-cycle + album essay collapse', () => {
  test('clicking the visualization cycles the mode; clicking the HUD does not', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name.includes('390'), 'viz click-cycle verified on desktop');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const label = page.locator('#modeBtnLabel');
    const before = (await label.innerText()).trim();

    // Click an EMPTY viz spot. The hero/canvas is pointer-events:none, so a real
    // click there falls through to #bg — exactly how the cycle is meant to fire.
    // (600,250) is below the top-right HUD and above the centred hero text.
    await page.mouse.click(600, 250);
    await expect(async () => {
      expect((await label.innerText()).trim()).not.toBe(before);
    }).toPass({ timeout: 5000 });

    // Clicking the HUD (pointer-events:auto) must NOT cycle.
    const after = (await label.innerText()).trim();
    await page.locator('#hudBpm').click();
    await page.waitForTimeout(600);
    expect((await label.innerText()).trim()).toBe(after);
  });

  test('album essays are collapsed with a working expand toggle', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await settle(page);
    for (let i = 0; i < 5; i++) {
      await page
        .locator('.album[data-album]')
        .nth(i)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await page.waitForTimeout(600);
    }
    // First VISIBLE toggle (shown only when the clamped essay overflows). Use a
    // position-stable locator — NOT text-filtered, which would stop matching
    // after the click flips "Read more" → "Show less".
    const toggle = page.locator('.album__drop-toggle:visible').first();
    await expect(toggle).toBeVisible({ timeout: 20000 });
    await expect(toggle).toHaveText(/read more/i);
    await expect(page.locator('.album__drop--expanded')).toHaveCount(0);

    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    await expect(page.locator('.album__drop--expanded')).toHaveCount(1);
    await expect(toggle).toHaveText(/show less/i);
  });
});
