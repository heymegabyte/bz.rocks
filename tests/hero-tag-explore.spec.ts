import { test, expect, type Page } from '@playwright/test';

// The hero vibe-tag chips (AI-derived mood/genre/theme/place) are now an
// EXPLORATION tool: a SELECTIVE tag is a <button> that opens the search filtered
// to every track sharing it (grounded via tracksByTag — the AI's own
// categorization made navigable). A near-universal tag ("sacred" on 92% of a
// gospel catalog) would return ~everything, so it stays an inert <span>. Runs
// against PROD_URL. chef-lu-stew is a deterministic fixture: bay-area(9) +
// no-substance(7) are selective; sacred/mercy/gospel are near-universal.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const ALBUM = 'desiiignare';
const TRACK = 'chef-lu-stew';

async function openTrack(page: Page) {
  await page.goto(`${BASE}/${ALBUM}/${TRACK}`, { waitUntil: 'domcontentloaded' });
  await page
    .locator('#apClose')
    .click({ timeout: 2000 })
    .catch(() => {}); // clear autoplay prompt
  await expect(page.locator('#heroTags')).toBeVisible({ timeout: 15000 });
}

test.describe('hero vibe tags — tap to explore', () => {
  test('selective tags are explorable buttons; universal tags stay inert', async ({ page }) => {
    await openTrack(page);
    const buttons = page.locator('#heroTags button[data-explore-tag]');
    await expect(buttons.first()).toBeVisible({ timeout: 10000 });
    const btnLabels = (await buttons.allInnerTexts()).map(s => s.trim().toLowerCase());
    expect(btnLabels.length).toBeGreaterThan(0);

    // The near-universal moods must NOT be explorable (they'd return ~everything).
    for (const universal of ['sacred', 'mercy', 'gospel']) {
      expect(btnLabels).not.toContain(universal);
      // ...and they still render as inert chips (not dropped).
      await expect(
        page.locator(`#heroTags .viz__hero-tag:not(button)`, { hasText: new RegExp(universal, 'i') })
      ).toHaveCount(1);
    }
  });

  test('tapping a selective tag opens the search to a FOCUSED, grounded set', async ({ page }) => {
    await openTrack(page);
    const firstBtn = page.locator('#heroTags button[data-explore-tag]').first();
    await expect(firstBtn).toBeVisible({ timeout: 10000 });
    const tag = (await firstBtn.getAttribute('data-explore-tag'))!;

    await firstBtn.click();
    // Search overlay opens, prefilled with the tag, showing its tag-mates.
    await expect(page.locator('#cmdk.is-open')).toHaveCount(1);
    await expect(page.locator('#cmdkInput')).toHaveValue(tag);
    const countText = (await page.locator('#cmdkCount').textContent()) || '';
    const n = parseInt(countText.match(/(\d+)\s*track/)?.[1] || '9999', 10);
    expect(n).toBeGreaterThan(0);
    // Focused — a selective tag never returns ~the whole 168-track catalog.
    expect(n).toBeLessThan(84);

    // The results are real, tap-to-play tracks: clicking one plays it.
    const firstResult = page.locator('#cmdkResults .cmdk__item--track, #cmdkResults .cmdk__item').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
            return !!a && !a.paused;
          }),
        { timeout: 8000 }
      )
      .toBe(true);
  });
});
