import { test, expect } from '@playwright/test';

// The Queue "AI" tab used to be the GLOBAL popularity chart (plays×0.73+shares×0.27) —
// identical for everyone, zero context. Now it's genuinely context-aware AI: it leads
// with grounded semantic picks for the CURRENT track (the cached /api/similar engine,
// each with its "why"), then honest popularity fill. Paints popularity instantly and
// upgrades when the grounded picks land (fail-soft). Runs on PROD.

async function openQueueViaMore(page: import('@playwright/test').Page, playFirst: boolean) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .locator('#apClose')
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
  if (playFirst) {
    // Playing a track sets currentTrackId (synchronously in play()) so the AI tab has
    // a seed for "because you're playing X" — even if headless autoplay is gated.
    await page
      .locator('.trackrow')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.locator('#btnMore').click({ timeout: 8000 });
  await page.waitForTimeout(400);
  await page.locator('.more-menu__item[data-action="queue"]').click({ timeout: 8000 });
  await page.waitForTimeout(500);
  await page.locator('.queue-panel__tab[data-tab="ai"]').click();
}

test.describe('Queue AI tab — context-aware grounded picks', () => {
  test('with a track playing, leads with grounded "because you\'re playing X" picks + whys', async ({
    page
  }) => {
    await openQueueViaMore(page, true);
    // The grounded picks arrive from the (cached) /api/similar fetch; give it a beat.
    const sect = page.locator('.queue-sect--ai');
    await expect(sect).toBeVisible({ timeout: 12000 });
    await expect(sect).toContainText(/because you're playing/i);
    // At least one grounded "why" (the semantic reason) renders as a row sub...
    const whys = page.locator('#queueBody .queue-row__why');
    expect(await whys.count()).toBeGreaterThan(0);
    await expect(whys.first()).not.toBeEmpty();
    // ...and those rows are real, clickable queue rows (actionable, not decoration).
    const groundedRow = page
      .locator('#queueBody .queue-row')
      .filter({ has: page.locator('.queue-row__why') })
      .first();
    await expect(groundedRow).toHaveAttribute('data-q-track', /.+/);
    // Honest popularity fill still present below the grounded section.
    await expect(page.locator('#queueBody .queue-sect', { hasText: /popular now/i })).toBeVisible();
  });

  test('with nothing playing, falls back to the popularity list (no "because you\'re playing")', async ({
    page
  }) => {
    await openQueueViaMore(page, false);
    await page.waitForTimeout(800);
    // Rows render immediately (instant popularity paint — never blocks/empties)...
    expect(await page.locator('#queueBody .queue-row').count()).toBeGreaterThan(0);
    // ...and with no current track there's no contextual grounded section.
    await expect(page.locator('.queue-sect--ai')).toHaveCount(0);
  });
});
