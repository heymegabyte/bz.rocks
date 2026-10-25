import { test, expect, type Page } from '@playwright/test';

// Now-playing "Related tracks" = grounded "more like this" via the 70B /api/similar
// engine (the same engine behind the Queue AI tab + AI Radio), each pick carrying
// its semantic "why". An instant local tag-Jaccard paint sits underneath so the
// section never blocks on the network; the grounded picks replace it when they land
// (fail-soft keeps the Jaccard if /api/similar misses). Deterministic via the
// captured response, like ai-meaning.spec.ts. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const ALBUM = 'signals';
const TRACK = 'bermuda-prophecy';
const TITLE = 'Bermuda Prophecy';

async function dismissAutoplayPrompt(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function openNowPlaying(page: Page) {
  await page.goto(`${BASE}/${ALBUM}/${TRACK}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#transportNpTitle')).toHaveText(TITLE, { timeout: 15000 });
  await dismissAutoplayPrompt(page);
  await page.locator('#transportNpCover').evaluate((el: HTMLElement) => el.click());
}

test.describe('now-playing Related — grounded /api/similar "why"', () => {
  test('related picks carry a grounded why + stay tap-to-play (fail-soft to Jaccard)', async ({
    page
  }) => {
    const related = page.locator('#npPanelRelated');
    const items = page.locator('.np-panel__related-item');
    const whys = page.locator('.np-panel__related-why');

    const respP = page.waitForResponse(
      r => r.url().includes('/api/similar') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await openNowPlaying(page);
    const resp = await respP;
    const picks =
      ((await resp.json()) as { similar?: Array<{ id?: string; why?: string }> }).similar ?? [];
    const grounded = picks.filter(p => p?.id && p?.why);

    // The Related section is wired + populated either way (grounded or Jaccard).
    await expect(related).toBeVisible({ timeout: 10000 });
    expect(await items.count()).toBeGreaterThan(0);

    if (grounded.length) {
      // The grounded picks replaced the instant Jaccard paint, each with its "why".
      await expect(whys.first()).toBeVisible({ timeout: 10000 });
      expect(await whys.count()).toBeGreaterThan(0);
      expect((await whys.first().innerText()).trim().length).toBeGreaterThan(2);
      // ...and the picks stay actionable: tapping plays it in the persistent
      // player. The reliable signal is the transport title changing to the new
      // track (audio FILENAMES differ from track ids — Chef_Lu_Stew.mp3 vs
      // chef-lu-stew — so never assert the id is in currentSrc).
      await items.first().click();
      await expect(page.locator('#transportNpTitle')).not.toHaveText(TITLE, { timeout: 8000 });
    }
    // grounded.length === 0 → fail-soft: the Jaccard fallback rendered items (asserted above).
  });
});
