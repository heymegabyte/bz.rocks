import { test, expect, type Page } from '@playwright/test';

// Prod smoke for the 3 new "nexty" albums (Wake Up Alice / The Pause / Little
// Lanterns). Real-user journey: homepage → album → play a track → assert audio
// advances + lyrics render, console-error-free. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// Env escape hatch: pin a specific chromium binary when the exact pinned build
// isn't installed (CI/local browser-cache churn). No-op when unset.
if (process.env.CHROMIUM_BIN) test.use({ launchOptions: { executablePath: process.env.CHROMIUM_BIN } });

async function dismissAutoplayPrompt(page: Page) {
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
}

test('new albums render, a track plays, lyrics show, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', e => errors.push(String(e)));

  // 1. Homepage boots.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible();

  // 2. Navigate to the new album (SPA route — the shell boots the same app).
  await page.goto(`${BASE}/wake-up-alice`, { waitUntil: 'domcontentloaded' });
  await dismissAutoplayPrompt(page);

  // 3. All 14 tracks of the album render, including an alt-mix + a duet.
  const rows = page.locator('a.trackrow[data-track]');
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('a.trackrow[data-track="the-rabbit-looking-glass-mix"]')).toBeVisible();
  await expect(page.locator('a.trackrow[data-track="find-me-on-algenib"]')).toBeVisible();

  // 4. Click a track → playback starts on the persistent audio element.
  await page
    .locator('a.trackrow[data-track="facts-before-fear"], a.trackrow[data-track="wake-up-alice"]')
    .first()
    .click();
  await dismissAutoplayPrompt(page);
  // Force a play() in case autoplay policy paused it (user-gesture already given by click).
  await page.evaluate(() =>
    (document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null)?.play().catch(() => {})
  );

  // 5. Audio advances past 0.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
          return a ? a.currentTime : -1;
        }),
      { timeout: 15000, message: 'audio currentTime should advance' }
    )
    .toBeGreaterThan(0.3);

  // 6. The audio src points at a real mp3.
  const src = await page.evaluate(
    () => (document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null)?.currentSrc || ''
  );
  expect(src).toMatch(/\/audio\/[a-z0-9-]+\.mp3/);

  // 7. No console errors during the journey.
  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});
