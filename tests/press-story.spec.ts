import { test, expect } from '@playwright/test';

// The per-track press kit (/press/<id>) now surfaces the grounded AI liner note
// as "The story behind …" — the editorial angle for editors/playlisters, reusing
// /api/liner (Workers AI, grounded, KV-cached). Filled client-side, fail-soft:
// the story section is hidden until the liner loads (no orphan heading).
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const TRACK = 'border-mercy';

test('press page carries the story-section container (hidden until filled)', async ({ page }) => {
  const resp = await page.goto(`${BASE}/press/${TRACK}`, { waitUntil: 'domcontentloaded' });
  expect(resp?.status()).toBe(200);
  await expect(page.locator('#pressStory')).toHaveCount(1);
  await expect(page.locator('#pressStory h2')).toContainText(/story behind/i);
});

test('the story fills from the track liner (reuses /api/liner)', async ({ page, request }) => {
  const liner =
    ((await (await request.get(`${BASE}/api/liner?track=${TRACK}`)).json()) as { liner?: string | null }).liner ?? '';
  await page.goto(`${BASE}/press/${TRACK}`, { waitUntil: 'domcontentloaded' });
  const story = page.locator('#pressStory');
  test.skip(!liner || liner.trim().length === 0, 'liner cold this run — nothing to display');
  await expect(story).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#pressLiner')).toHaveText(/\S/, { timeout: 10000 });
  // Grounded: the liner is substantial prose, not a stub.
  expect((await page.locator('#pressLiner').innerText()).trim().length).toBeGreaterThan(40);
});
