import { test, expect } from '@playwright/test';

// The cmdk search is powerful — literal title, LYRIC content (jump-to-moment), AND NL
// vibe/mood search (/api/vibe AI picks) — but a "Search tracks" box hid all of that; a
// user never discovered they could type a mood or a lyric. The empty state now surfaces
// clickable example-query chips (an empty-state launchpad). Runs on PROD.

async function openSearch(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .locator('#apClose')
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.locator('#btnSearch').click();
  return page.locator('#cmdkInput');
}

test.describe('Cmd+K search — empty-state suggestions', () => {
  test('empty search surfaces vibe/lyric suggestion chips + a capability-hinting placeholder', async ({
    page
  }) => {
    const input = await openSearch(page);
    await page.waitForTimeout(400);
    // The placeholder now advertises the breadth (not just "Search tracks").
    await expect(input).toHaveAttribute('placeholder', /lyric|vibe/i);
    // The empty state shows the suggestion launchpad with ≥3 clickable chips.
    await expect(page.locator('.cmdk__suggest')).toBeVisible();
    const chips = page.locator('.cmdk__suggest-chip');
    expect(await chips.count()).toBeGreaterThanOrEqual(3);
    await expect(chips.first()).toBeVisible();
  });

  test('clicking a suggestion fills the input, runs the query, and hides the chips', async ({
    page
  }) => {
    await openSearch(page);
    await page.waitForTimeout(400);
    const chip = page.locator('.cmdk__suggest-chip', { hasText: /mercy at the checkpoint/i });
    await expect(chip).toBeVisible();
    await chip.click();
    // The input is filled with the chip's query + the suggestions vanish (query non-empty).
    await expect(page.locator('#cmdkInput')).toHaveValue(/mercy at the checkpoint/i);
    await expect(page.locator('.cmdk__suggest')).toHaveCount(0);
    // These are VIBE queries (0 literal matches by design — they showcase the NL /api/vibe
    // AI search), so results arrive async as AI picks. Wait for them to render.
    await page.waitForFunction(
      () => document.querySelectorAll('#cmdkResults .cmdk__item').length > 0,
      { timeout: 12000 }
    );
    expect(await page.locator('#cmdkResults .cmdk__item').count()).toBeGreaterThan(0);
  });
});
