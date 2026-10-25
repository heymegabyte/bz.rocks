import { test, expect, type Page } from '@playwright/test';

// AI "how this song lives its wisdom" — one grounded line from /api/wisdom
// (Workers AI, KV-cached) tying the track's Greene-law / scripture wisdom to a
// CONCRETE move in the song, never restating the law. Rendered directly under
// the wisdom quote in the now-playing panel. Same grounded + fail-soft contract
// as /api/liner + /api/meaning. Runs against PROD_URL like the rest of the suite.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// A real track that carries a wisdom line (also the cinematic-video track).
const ALBUM = 'signals';
const TRACK = 'bermuda-prophecy';
const TITLE = 'Bermuda Prophecy';

// The anti-generic contract the server backstops — the rendered line must never
// be an interchangeable faith-platitude that could describe any bZ song.
const GENERIC =
  /\bthrough faith and action\b|\bfaith in action\b|\bembodies?\s+(?:resilience|determination|strength|the ?law)\b|\ba testament to\b|\bhard-?won wisdom\b/i;

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

test.describe('AI "how this song lives its wisdom" (/api/wisdom)', () => {
  test('API returns a grounded, non-generic how-line for a known track and 404 for an unknown one', async ({
    request
  }) => {
    const ok = await request.get(`${BASE}/api/wisdom?track=${TRACK}`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { how?: unknown };
    // `how` is a non-empty string when the track has wisdom + generation succeeded,
    // else null (fail-soft / no-wisdom). Never an object or empty string.
    if (body.how !== null && body.how !== undefined) {
      expect(typeof body.how).toBe('string');
      const how = (body.how as string).trim();
      expect(how.length).toBeGreaterThan(9);
      expect(how).not.toMatch(GENERIC);
    }

    const missing = await request.get(`${BASE}/api/wisdom?track=not-a-real-track-xyz`);
    expect(missing.status()).toBe(404);
  });

  test('now-playing panel reveals the how-line under the wisdom quote when generated', async ({
    page
  }) => {
    const how = page.locator('#npPanelWisdomHow');
    const body = page.locator('#npPanelWisdomHowBody');

    // Capture the generation result so the assertion is deterministic:
    // populated → block visible with a concrete line; empty → fail-soft hidden.
    const respP = page.waitForResponse(
      r => r.url().includes('/api/wisdom') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await openNowPlaying(page);
    const resp = await respP;
    const line = ((await resp.json()) as { how?: string | null }).how ?? '';

    // The block must be wired into the now-playing DOM either way.
    await expect(how).toHaveCount(1);

    if (line.trim().length > 9) {
      await expect(how).toBeVisible({ timeout: 10000 });
      const rendered = (await body.innerText()).trim();
      expect(rendered.length).toBeGreaterThan(9);
      expect(rendered).not.toMatch(GENERIC);
      // The honest "· AI" eyebrow is present (never hide the real tier).
      await expect(how.locator('.np-panel__liner-eyebrow')).toContainText('AI');
    } else {
      await expect(how).toBeHidden();
    }
  });
});
