import { test, expect, type Page } from '@playwright/test';

// AI "more like this" — the 3 grounded most-similar tracks for the current song
// (Workers AI, KV-cached, fail-soft, every id re-validated against the catalog
// and never the anchor). Rendered as tappable chips in the now-playing panel.
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

test.describe('AI more-like-this (/api/similar + NP chips)', () => {
  test('API returns grounded similar tracks (never the anchor); 404 for unknown', async ({ request }) => {
    const ok = await request.get(`${BASE}/api/similar?track=${TRACK}`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { similar?: Array<{ id: string; why: string }> };
    expect(Array.isArray(body.similar)).toBe(true);
    const whys: string[] = [];
    // Every track is gospel-rap, so a bare genre label is a non-reason (the #1
    // generic-prose tell). Reasons must be SPECIFIC + grounded + DISTINCT.
    const bareGenre =
      /^(?:(?:epic|latin|hard|holy|dark|raw)\s+)?gospel[\s-]?trap(?:\s+(?:vibe|sound|energy))?$|^(?:same|similar)\s+(?:vibe|sound|genre|energy)$|^(?:same|shared)\s+genre$/i;
    for (const s of body.similar ?? []) {
      expect(typeof s.id).toBe('string');
      expect(s.id).not.toBe(TRACK);
      expect(typeof s.why).toBe('string');
      expect(s.why.trim().length).toBeGreaterThan(2);
      expect(s.why, `bare genre label is not a real connection: "${s.why}"`).not.toMatch(bareGenre);
      whys.push(s.why.trim().toLowerCase());
    }
    // No repeated reason across the picks (the clustered-album failure mode).
    expect(new Set(whys).size, `duplicate reasons: ${JSON.stringify(whys)}`).toBe(whys.length);

    const bad = await request.get(`${BASE}/api/similar?track=not-a-real-track-xyz`);
    expect(bad.status()).toBe(404);
  });

  test('now-playing reveals similar chips that play a different track', async ({ page }) => {
    const respP = page.waitForResponse(
      r => r.url().includes('/api/similar') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await openNowPlaying(page);
    const items =
      ((await respP.then(r => r.json())) as { similar?: Array<{ id: string; why: string }> }).similar ?? [];

    const similar = page.locator('#npPanelSimilar');
    await expect(similar).toHaveCount(1);
    if (items.length) {
      await expect(similar).toBeVisible({ timeout: 10000 });
      const chips = page.locator('#npPanelSimilarChips .np-panel__similar-chip');
      expect(await chips.count()).toBeGreaterThanOrEqual(1);
      await chips.first().click();
      await expect(async () => {
        const t = (await page.locator('#transportNpTitle').innerText()).trim();
        expect(t.length).toBeGreaterThan(0);
        expect(t).not.toBe(TITLE);
      }).toPass({ timeout: 5000 });
    } else {
      await expect(similar).toBeHidden();
    }
  });
});
