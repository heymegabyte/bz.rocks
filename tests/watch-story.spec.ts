import { test, expect } from '@playwright/test';

// The cinematic film watch page (/watch/<id>) now carries (1) a GROUNDED
// VideoObject/meta description (the track's real wisdom line, not a generic
// "watch the film" template → video SEO) and (2) a visible "The story behind
// the film" section filled from the grounded AI liner (reuse /api/liner).
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const TRACK = 'border-mercy';

test('watch page has a grounded VideoObject/meta description (not the generic template)', async ({ request }) => {
  const r = await request.get(`${BASE}/watch/${TRACK}`);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toContain('Newark hustle-gospel'); // the new grounded base phrase
  expect(html).not.toContain('cinematic music video. Watch the film.'); // old generic gone
  expect(html).toMatch(/"@type":\s*"VideoObject"/); // schema still present
});

test('watch page carries the film-story container (hidden until filled)', async ({ page }) => {
  const resp = await page.goto(`${BASE}/watch/${TRACK}`, { waitUntil: 'domcontentloaded' });
  expect(resp?.status()).toBe(200);
  await expect(page.locator('#filmStory')).toHaveCount(1);
  await expect(page.locator('#filmStory h2')).toContainText(/story behind the film/i);
  // Exactly one h1 (the film title) — the story heading is an h2.
  await expect(page.locator('h1')).toHaveCount(1);
});

test('the film story fills from the track liner (reuses /api/liner)', async ({ page, request }) => {
  const liner =
    ((await (await request.get(`${BASE}/api/liner?track=${TRACK}`)).json()) as { liner?: string | null }).liner ?? '';
  await page.goto(`${BASE}/watch/${TRACK}`, { waitUntil: 'domcontentloaded' });
  const story = page.locator('#filmStory');
  test.skip(!liner || liner.trim().length === 0, 'liner cold this run — nothing to display');
  await expect(story).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#filmLiner')).toHaveText(/\S/, { timeout: 10000 });
  expect((await page.locator('#filmLiner').innerText()).trim().length).toBeGreaterThan(40);
});
