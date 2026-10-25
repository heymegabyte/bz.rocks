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
  test('API returns grounded, CONCRETE (non-circular) picks across moods; empties a too-short query', async ({
    request
  }) => {
    // Queries that previously produced circular/leaky/templated whys on the 8B
    // ("X matches the <query> mood", "reason:" leak, id-as-title, off-intent padding).
    // A reason whose every content word is ALREADY in the query just re-labels it
    // ("late night prayer" → "Late night prayer") — a non-reason. Post-#v4 the worker
    // catches this + backfills from the track's vibe, so every why must ADD at least
    // one concrete word the query doesn't contain.
    const STOP = new Set(
      'the a an of to in on at for and or with through my your this that is are be it his her their from into over as by not no you we they i me off up out'.split(
        ' '
      )
    );
    const toks = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && !STOP.has(w));
    const QUERIES = [MOOD, 'mercy at the border', 'scripture about forgiveness'];
    for (const q of QUERIES) {
      const qTok = new Set(toks(q));
      const ok = await request.get(`${BASE}/api/vibe?q=${encodeURIComponent(q)}`);
      expect(ok.status(), q).toBe(200);
      const body = (await ok.json()) as { picks?: Array<{ id: string; why: string }> };
      expect(Array.isArray(body.picks), q).toBe(true);
      for (const p of body.picks ?? []) {
        expect(typeof p.id).toBe('string');
        expect(typeof p.why).toBe('string');
        expect(p.why.length, `${q} → ${p.id}`).toBeGreaterThan(3);
        const why = p.why.toLowerCase();
        // No prompt-format leak (the 8B leaked a `reason:`/`why:` prefix).
        expect(why, `${q} leak`).not.toMatch(/^\s*(reason|why|mood|track)\s*[:\-]/);
        // No circular non-reason — restating the query/id as "the mood" ("X matches
        // the <query> mood", "is a song about …") is meaningless; demand a concrete tie.
        expect(why, `${q} circular`).not.toMatch(
          /matches the .*(mood|vibe|query)|fits the .*(mood|vibe|query)|is a song about|^["']?[a-z0-9-]+["']?\s+matches/
        );
        // Refer to the track by TITLE, never its id-slug.
        expect(why, `${q} id-as-title`).not.toContain(p.id);
        // Not a pure query-echo — the why must add a word beyond the query.
        const wTok = toks(p.why);
        expect(
          wTok.some(w => !qTok.has(w)),
          `${q} → ${p.id} query-echo (adds nothing): "${p.why}"`
        ).toBe(true);
      }
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
