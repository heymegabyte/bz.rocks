import { test, expect } from '@playwright/test';

// "Search a lyric → jump to that moment": a Cmd+K search that matches on LYRIC
// content (not title/album/vibe) surfaces the matched lyric line in the result and,
// when selected, seeks playback to where that line is actually sung (grounded in the
// Whisper-aligned per-word timestamps in /lyrics/<id>.json). Runs on PROD.
//
// "burning" is lyric-only (sung in "…the beast down burning in the deep" etc.) and
// appears in no title/album/vibe, so it's a clean lyric-match probe. (Evocative words
// like "checkpoint"/"border" are IN the vibes, so they're metadata matches, not lyric.)

test.describe('Cmd+K lyric-moment search', () => {
  async function openSearch(page: import('@playwright/test').Page) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.locator('#btnSearch').click();
    return page.locator('#cmdkInput');
  }

  test('a lyric-only match surfaces the matched line + a jump badge + highlighted query', async ({
    page
  }) => {
    const input = await openSearch(page);
    await input.fill('burning');
    // enrichSearchLyrics lazy-loads the lyrics chunk on search-open; give it a beat.
    await page.waitForTimeout(1500);

    // The matched lyric line is rendered as the row sub (not the album·vibe metadata).
    const lyric = page.locator('#cmdkResults .cmdk__item-lyric').first();
    await expect(lyric).toBeVisible();
    // The query is highlighted inside it...
    const hl = lyric.locator('.cmdk__hl');
    await expect(hl).toBeVisible();
    await expect(hl).toContainText(/burning/i);
    // ...and the row carries the "jump" badge that signals seek-on-select.
    await expect(page.locator('#cmdkResults .cmdk__item-badge--jump').first()).toBeVisible();
  });

  test('selecting a lyric match SEEKS playback to that moment (not 0:00)', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('burning');
    await page.waitForTimeout(1500);

    // The first result is the lyric match; selecting it plays + seeks.
    const firstLyricRow = page
      .locator('#cmdkResults .cmdk__item')
      .filter({ has: page.locator('.cmdk__item-lyric') })
      .first();
    await expect(firstLyricRow).toBeVisible();
    await firstLyricRow.click();

    // The seek is applied once metadata loads + the timed .json resolves. The matched
    // line is well into the track, so currentTime must jump past the intro — proving
    // it started at the lyric MOMENT, not 0:00. (Playback itself may be autoplay-gated
    // headless, but the seek sets currentTime regardless.)
    await page.waitForFunction(
      () => {
        const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
        return !!a && a.currentTime > 3;
      },
      { timeout: 12000 }
    );
    const t = await page.evaluate(() => {
      const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
      return a?.currentTime ?? 0;
    });
    expect(t).toBeGreaterThan(3);
  });

  test('a plain TITLE match does NOT show a lyric snippet (plays from the start)', async ({
    page
  }) => {
    const input = await openSearch(page);
    // "mercy" leads with title matches (relevance-ranked) — those keep the normal
    // album·vibe sub, no lyric snippet on the top row.
    await input.fill('mercy');
    await page.waitForTimeout(800);
    const firstRow = page.locator('#cmdkResults .cmdk__item').first();
    await expect(firstRow).toBeVisible();
    // The top (title) match has no lyric snippet / jump badge.
    await expect(firstRow.locator('.cmdk__item-lyric')).toHaveCount(0);
    await expect(firstRow.locator('.cmdk__item-badge--jump')).toHaveCount(0);
  });
});
