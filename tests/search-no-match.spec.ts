import { test, expect, type Page } from '@playwright/test';

// No-match recovery launchpad — a search query that matches NO track (literal),
// NO content page, AND NO semantic AI vibe pick used to dead-end at a bare
// "No tracks found". It now offers the same clickable vibe/mood/lyric starters as
// the empty state (first-time-excellence: every state orients + offers a next
// action), reusing the delegated .cmdk__suggest-chip handler.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// Gibberish that can't match any title/lyric/vibe/album or a real concept.
const NO_MATCH = 'zxqwvb plumbing invoice xyzzy';

async function openSearch(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.locator('#btnSearch').click();
  await expect(page.locator('#cmdk')).toHaveClass(/is-open/);
  await expect(page.locator('#cmdkInput')).toBeFocused();
}

test.describe('Search no-match recovery launchpad', () => {
  test('a no-match query offers clickable vibe starters, not a dead end', async ({ page }) => {
    await openSearch(page);
    await page.locator('#cmdkInput').fill(NO_MATCH);

    // The recovery launchpad appears (not the bare "No tracks found").
    const recovery = page.locator('#cmdkResults .cmdk__suggest');
    await expect(recovery).toBeVisible({ timeout: 8000 });
    await expect(recovery).toContainText(/No match/i);
    const chips = page.locator('#cmdkResults .cmdk__suggest-chip');
    expect(await chips.count()).toBeGreaterThanOrEqual(3);
    // The bare empty element is NOT shown.
    await expect(page.locator('#cmdkEmpty')).toBeHidden();

    // Tapping a chip fills the input + runs that query → real results replace the recovery.
    const firstChip = chips.first();
    const chipQuery = (await firstChip.getAttribute('data-suggest')) || '';
    expect(chipQuery.length).toBeGreaterThan(2);
    await firstChip.click();
    await expect(page.locator('#cmdkInput')).toHaveValue(chipQuery);
    // The query runs: the recovery "No match" header is gone (real matches, literal and/or AI).
    await expect(page.locator('#cmdkResults')).not.toContainText(/No match/i, { timeout: 10000 });
    await expect(page.locator('#cmdkResults .cmdk__item[data-idx]').first()).toBeVisible({
      timeout: 10000
    });
  });
});
