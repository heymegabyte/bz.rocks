import { test, expect } from '@playwright/test';

// Cmd+K search render cap: the catalog is large (~168 tracks), so an empty/short
// query matched the whole catalog and rebuilt that many image rows (and
// re-lowercased every track's lyrics) on EVERY keystroke — the search-typing INP
// cost. Now the filter uses a precomputed lowercased blob, the render is capped
// at 24 rows (coalesced to one rAF per burst), and the count shows the true
// total. This guards the cap + that filtering/nav/play still work. Runs on PROD.

test.describe('Cmd+K search — capped render', () => {
  test('a broad query caps rendered rows at 24 but shows the true total', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.locator('#btnSearch').click();
    await page.waitForTimeout(400);
    const rows = page.locator('#cmdkResults .cmdk__item');
    expect(await rows.count()).toBeLessThanOrEqual(24);
    // A large catalog → the count reflects the true total + a "top 24" note.
    await expect(page.locator('#cmdkCount')).toContainText(/top 24/);
  });

  test('typing narrows the results and a result plays on Enter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.locator('#btnSearch').click();
    const input = page.locator('#cmdkInput');
    await input.fill('mercy');
    await page.waitForTimeout(500);
    const rows = page.locator('#cmdkResults .cmdk__item');
    const n = await rows.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(24);
    // Relevance-ranked: the capped results lead with TITLE matches, not just the
    // first catalog-order matches — the first result's title contains "mercy".
    const firstTitle = (
      await page.locator('#cmdkResults .cmdk__item-title-text').first().innerText()
    )
      .trim()
      .toLowerCase();
    expect(firstTitle, `first result "${firstTitle}" should be a title match`).toContain('mercy');
    await input.press('ArrowDown');
    await input.press('Enter');
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

  test('section markers (chorus/verse) do not pollute the lyric index', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.locator('#btnSearch').click();
    const input = page.locator('#cmdkInput');
    // Before the fix these matched EVERY track carrying a '**[Chorus]**' /
    // '**[Pre-Chorus]**' / '**[Outro]**' section marker (33 / 28 / 14). Stripping
    // the markers from the index leaves only tracks that SING those words — a
    // sharp drop. (Avoid "verse": it's a legit substring of universe/diverse/reverse.)
    for (const [q, max] of [
      ['chorus', 12],
      ['pre-chorus', 5],
      ['outro', 6]
    ] as const) {
      await input.fill(q);
      await page.waitForTimeout(500);
      const countText = (await page.locator('#cmdkCount').textContent()) ?? '';
      const n = Number(/^(\d+)\s*track/.exec(countText)?.[1] ?? '999');
      expect(n, `"${q}" matched ${n} tracks — section markers should be out of the index`).toBeLessThan(max);
    }
  });
});
