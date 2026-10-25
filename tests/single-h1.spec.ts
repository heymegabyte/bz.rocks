import { test, expect, type Page } from '@playwright/test';

// Exactly ONE <h1> per rendered page (SEO + a11y heading-outline). The worker
// server-renders a crawlable <h1> inside the "About this page" SEO disclosure so
// no-JS crawlers get a track/album-named h1; once the client shell mounts its own
// hero <h1>, that SEO heading must demote to <h2> or the rendered page carries
// two <h1>s. This guards the de-dupe across the most-indexed route types.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function h1s(page: Page): Promise<string[]> {
  return page.evaluate(() => [...document.querySelectorAll('h1')].map(h => (h.textContent || '').trim()));
}

for (const [name, path] of [
  ['home', '/'],
  ['album', '/signals'],
  ['track', '/mercy-drop/border-mercy']
] as const) {
  test(`${name} renders exactly one <h1>`, async ({ page }) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    // Let the client shell mount its hero + run the SEO-heading de-dupe.
    await expect(page.locator('h1')).toHaveCount(1, { timeout: 8000 });
    const heads = await h1s(page);
    expect(heads.length, `h1s: ${JSON.stringify(heads)}`).toBe(1);
    expect(heads[0]!.length).toBeGreaterThan(0);
  });
}

test('track h1 is the hero (track-named), and the SEO prose heading is demoted to h2', async ({ page }) => {
  await page.goto(BASE + '/mercy-drop/border-mercy', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveCount(1, { timeout: 8000 });
  // The single h1 is the cinematic hero, carrying the track name.
  await expect(page.locator('h1')).toHaveClass(/viz__hero-title/);
  await expect(page.locator('h1')).toHaveText(/border mercy/i);
  // The SEO "About this page" prose TITLE (was an <h1>) is now the first <h2> in
  // the disclosure (the prose also carries its own section h2s), and NO <h1>
  // remains inside the SEO body (it must never re-introduce a second page h1).
  await expect(page.locator('.route-seo-body h2').first()).toContainText(/border mercy/i);
  await expect(page.locator('.route-seo-body h1')).toHaveCount(0);
  // Heading order is intact: the hero h1 precedes the SEO h2 in the DOM.
  const order = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1, h2')];
    return hs.map(h => h.tagName);
  });
  expect(order.indexOf('H1')).toBeLessThan(order.indexOf('H2'));
});
