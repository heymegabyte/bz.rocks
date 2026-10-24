import { test, expect, type Page } from '@playwright/test';

// AI vibe matcher — natural-language discovery layered on the Cmd+K track
// search (ai-first-search doctrine). A mood query ("late night prayer drive")
// calls /api/vibe, which ranks REAL catalog ids (Workers AI, grounded, KV-
// cached, fail-soft) and renders a distinct "AI vibe picks" group. The literal
// keyword filter stays the instant floor. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const MOOD = 'late night prayer drive';

async function openPalette(page: Page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.locator('#btnSearch').click();
  await expect(page.locator('#cmdk')).toHaveClass(/is-open/);
  await expect(page.locator('#cmdkInput')).toBeFocused();
}

test.describe('AI vibe matcher (/api/vibe + Cmd+K)', () => {
  test('API returns grounded typed picks for a mood; empties a too-short query', async ({ request }) => {
    const ok = await request.get(`${BASE}/api/vibe?q=${encodeURIComponent(MOOD)}`);
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { picks?: Array<{ id: string; why: string }> };
    expect(Array.isArray(body.picks)).toBe(true);
    for (const p of body.picks ?? []) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.why).toBe('string');
      expect(p.why.length).toBeGreaterThan(3);
    }

    const tooShort = await request.get(`${BASE}/api/vibe?q=a`);
    expect(tooShort.status()).toBe(200);
    expect(((await tooShort.json()) as { picks: unknown[] }).picks).toEqual([]);
  });

  test('literal track search still works instantly', async ({ page }) => {
    await openPalette(page);
    await page.locator('#cmdkInput').fill('bermuda');
    await expect(page.locator('#cmdkResults .cmdk__item[data-idx]').first()).toBeVisible({
      timeout: 8000
    });
    await expect(page.locator('#cmdkResults')).toContainText(/bermuda/i);
  });

  test('a mood query augments with grounded AI vibe picks', async ({ page }) => {
    await openPalette(page);
    const respP = page.waitForResponse(r => r.url().includes('/api/vibe') && r.request().method() === 'GET', {
      timeout: 30000
    });
    await page.locator('#cmdkInput').fill(MOOD);
    const resp = await respP;
    const picks = ((await resp.json()) as { picks?: Array<{ id: string; why: string }> }).picks ?? [];

    if (picks.length) {
      await expect(page.locator('.cmdk__group--ai')).toBeVisible({ timeout: 10000 });
      expect(await page.locator('#cmdkResults .cmdk__item-badge--ai').count()).toBeGreaterThanOrEqual(1);
      // Every AI row is a real, playable catalog track (grounding guarantee).
      expect(
        await page.locator('#cmdkResults .cmdk__item[data-idx] .cmdk__why').count()
      ).toBeGreaterThanOrEqual(1);
    } else {
      await expect(page.locator('.cmdk__group--ai')).toHaveCount(0);
    }
  });

  test('"Play as a set" plays the AI picks as an ordered queue', async ({ page }) => {
    await openPalette(page);
    const respP = page.waitForResponse(r => r.url().includes('/api/vibe') && r.request().method() === 'GET', {
      timeout: 30000
    });
    await page.locator('#cmdkInput').fill(MOOD);
    const resp = await respP;
    const picks = ((await resp.json()) as { picks?: Array<{ id: string; why: string }> }).picks ?? [];
    test.skip(picks.length < 2, 'need >=2 AI picks to exercise the set queue');

    await expect(page.locator('.cmdk__set-btn')).toBeVisible({ timeout: 10000 });
    await page.locator('.cmdk__set-btn').click();

    // Search closes and the first pick starts playing.
    await expect(page.locator('#cmdk')).not.toHaveClass(/is-open/);
    const title1 = (await page.locator('#transportNpTitle').innerText()).trim();
    expect(title1.length).toBeGreaterThan(0);
    expect(title1).not.toBe('Press play');

    // Next walks the custom SET (not catalog order) → a different track.
    await page.locator('#btnNext').click();
    await expect(async () => {
      const title2 = (await page.locator('#transportNpTitle').innerText()).trim();
      expect(title2.length).toBeGreaterThan(0);
      expect(title2).not.toBe(title1);
    }).toPass({ timeout: 5000 });
  });
});
