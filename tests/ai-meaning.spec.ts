import { test, expect, type Page } from '@playwright/test';

// AI lyric deep-dive — "what it's really saying": 3 grounded interpretive beats
// per track from /api/meaning (Workers AI, KV-cached), rendered under the liner
// note in the now-playing panel. Same grounded + fail-soft contract as
// /api/liner. Runs against PROD_URL like the rest of the suite.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// A real track that carries lyrics (also the first cinematic-video track).
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

test.describe('AI lyric deep-dive (/api/meaning)', () => {
  test('API returns a typed points[] for a known track and 404 for an unknown one', async ({ request }) => {
    const ok = await request.get(`${BASE}/api/meaning?track=${TRACK}`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { points?: unknown };
    expect(Array.isArray(body.points)).toBe(true);
    for (const p of body.points as unknown[]) expect(typeof p).toBe('string');

    const missing = await request.get(`${BASE}/api/meaning?track=not-a-real-track-xyz`);
    expect(missing.status()).toBe(404);
  });

  test('now-playing panel reveals the deep-dive when beats are generated', async ({ page }) => {
    const meaning = page.locator('#npPanelMeaning');
    const items = page.locator('#npPanelMeaningBody li');

    // Capture the generation result so the assertion is deterministic:
    // populated → panel visible with ≥2 beats; empty (model hiccup) → fail-soft hidden.
    const respP = page.waitForResponse(
      r => r.url().includes('/api/meaning') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await openNowPlaying(page);
    const resp = await respP;
    const points = ((await resp.json()) as { points?: string[] }).points ?? [];

    // The panel element must be wired into the now-playing DOM either way.
    await expect(meaning).toHaveCount(1);

    if (points.length >= 2) {
      await expect(meaning).toBeVisible({ timeout: 10000 });
      expect(await items.count()).toBeGreaterThanOrEqual(2);
      expect((await items.first().innerText()).trim().length).toBeGreaterThan(8);
    } else {
      await expect(meaning).toBeHidden();
    }
  });

  test('fullscreen lyrics surfaces the SAME grounded deep-dive (collapsed, reused)', async ({
    page
  }) => {
    const respP = page.waitForResponse(
      r => r.url().includes('/api/meaning') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await openNowPlaying(page);
    const points = ((await (await respP).json()) as { points?: string[] }).points ?? [];

    // From the now-playing panel, open the fullscreen lyrics view.
    await page.locator('[data-np-action="fs-lyrics"]').click();
    await expect(page.locator('#lyricsFs.is-open')).toHaveCount(1, { timeout: 8000 });

    const fsMeaning = page.locator('#lyricsFsMeaning');
    await expect(fsMeaning).toHaveCount(1); // wired either way
    if (points.length >= 2) {
      // Collapsed by default (never distracts karaoke), visible once beats land.
      await expect(fsMeaning).toBeVisible({ timeout: 10000 });
      await expect(fsMeaning).not.toHaveAttribute('open', /.*/); // starts collapsed
      await page.locator('#lyricsFsMeaning summary').click();
      const li = page.locator('#lyricsFsMeaningBody li');
      expect(await li.count()).toBeGreaterThanOrEqual(2);
      expect((await li.first().innerText()).trim().length).toBeGreaterThan(8);
    } else {
      await expect(fsMeaning).toBeHidden();
    }
  });
});
