import { test, expect, type Page } from '@playwright/test';

// Music-video feature — the Watch button + fullscreen cinematic film player wired
// to tracks that carry a `video` (Bermuda Prophecy is the first). Complements
// video-cinema.spec.ts by also asserting the audio-engine PAUSE handoff and that
// the <video> element is created + play()-ed on open.
//
// Runs against PROD_URL like the rest of the suite. Assertions are chosen to hold
// even when the film BYTES don't load (R2 outage / no static file yet): the
// overlay-open, engine-pause, <video>-src and Esc-close behaviors are all driven
// synchronously by openVideoCinema/closeVideoCinema, independent of the stream.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// Track known to carry a video, and one known NOT to. Mirrors video-cinema.spec.ts.
const TRACK_WITH_VIDEO = { path: '/signals/bermuda-prophecy', title: 'Bermuda Prophecy' };
const TRACK_WITHOUT_VIDEO = { path: '/reckless-grace/reckless-grace', title: 'Reckless Grace' };

// Mobile blocks autoplay -> a "tap to play" prompt (#apClose) can intercept
// clicks. Dismiss it before driving the transport. No-op on desktop.
async function dismissAutoplayPrompt(page: Page) {
  // The "tap to play" <dialog id="autoplayPrompt"> intercepts pointer events, so
  // wait for it, dismiss via #apClose (or the dialog itself), and wait for it to
  // leave the DOM before driving the transport.
  const dialog = page.locator('#autoplayPrompt');
  await dialog.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click({ force: true }).catch(() => {});
  else if (await dialog.isVisible().catch(() => false)) await dialog.click({ force: true }).catch(() => {});
  await dialog.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
}

// Open the now-playing panel. The transport cover pulses with the beat (never
// "stable"), so trigger the handler directly like the sibling specs do.
async function openNowPlaying(page: Page) {
  await page.locator('#transportNpCover').evaluate((el: HTMLElement) => el.click());
}

test.describe('Music video feature', () => {
  test('Watch button is HIDDEN for a track without a film', async ({ page }) => {
    await page.goto(`${BASE}${TRACK_WITHOUT_VIDEO.path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#transportNpTitle')).toHaveText(TRACK_WITHOUT_VIDEO.title, {
      timeout: 15000
    });
    await dismissAutoplayPrompt(page);
    await openNowPlaying(page);
    await expect(page.locator('#npPanelWatch')).toBeHidden();
  });

  test('Watch button is VISIBLE for a track with a film and opens the player', async ({ page }) => {
    await page.goto(`${BASE}${TRACK_WITH_VIDEO.path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#transportNpTitle')).toHaveText(TRACK_WITH_VIDEO.title, {
      timeout: 15000
    });
    await dismissAutoplayPrompt(page);
    await openNowPlaying(page);

    const watch = page.locator('#npPanelWatch');
    await expect(watch).toBeVisible({ timeout: 10000 });

    // Open the film — the overlay becomes visible and the <video> gets a source.
    await watch.evaluate((el: HTMLElement) => el.click());
    const cinema = page.locator('#videoCinema');
    await expect(cinema).toBeVisible({ timeout: 10000 });

    const player = page.locator('#videoCinemaPlayer');
    await expect(player).toBeVisible();
    const src = await player.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    expect(src).toContain('.mp4');
    // Poster is seeded from the track cover so a frame shows before playback.
    const poster = await player.evaluate((el: HTMLVideoElement) => el.getAttribute('poster') || '');
    expect(poster.length).toBeGreaterThan(0);
  });

  test('opening the film PAUSES the persistent audio engine', async ({ page }) => {
    await page.goto(`${BASE}${TRACK_WITH_VIDEO.path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#transportNpTitle')).toHaveText(TRACK_WITH_VIDEO.title, {
      timeout: 15000
    });
    await dismissAutoplayPrompt(page);

    // Start audio so the pause-on-open handoff is observable. Play via the engine
    // element directly (the transport play control is beat-animated).
    await page.evaluate(async () => {
      const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
      if (a) await a.play().catch(() => {});
    });

    await openNowPlaying(page);
    await page.locator('#npPanelWatch').evaluate((el: HTMLElement) => el.click());
    await expect(page.locator('#videoCinema')).toBeVisible({ timeout: 10000 });

    // The engine must be paused while the film is on screen.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
            return a ? a.paused : true;
          }),
        { timeout: 10000 }
      )
      .toBe(true);
  });

  test('Escape closes the film overlay', async ({ page }) => {
    await page.goto(`${BASE}${TRACK_WITH_VIDEO.path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#transportNpTitle')).toHaveText(TRACK_WITH_VIDEO.title, {
      timeout: 15000
    });
    await dismissAutoplayPrompt(page);
    await openNowPlaying(page);
    await page.locator('#npPanelWatch').evaluate((el: HTMLElement) => el.click());

    const cinema = page.locator('#videoCinema');
    await expect(cinema).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
    await expect(cinema).toBeHidden({ timeout: 10000 });
  });

  // Border Mercy ships as a STATIC asset (public/media/pub/border-mercy.mp4),
  // bypassing the R2 outage — so unlike Bermuda Prophecy its bytes actually play.
  test('Border Mercy film loads + plays from the static /media/pub lane', async ({ page }) => {
    await page.goto(`${BASE}/mercy-drop/border-mercy`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#transportNpTitle')).toHaveText('Border Mercy', { timeout: 15000 });
    await dismissAutoplayPrompt(page);
    await openNowPlaying(page);
    await page.locator('#npPanelWatch').evaluate((el: HTMLElement) => el.click());
    await expect(page.locator('#videoCinema')).toBeVisible({ timeout: 10000 });

    const player = page.locator('#videoCinemaPlayer');
    const src = await player.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    expect(src).toContain('/media/pub/border-mercy.mp4');

    // The bytes are reachable: metadata loads (duration ~3:40) and playback advances.
    await player.evaluate((el: HTMLVideoElement) => el.play().catch(() => {}));
    await expect
      .poll(() => player.evaluate((el: HTMLVideoElement) => el.readyState), { timeout: 15000 })
      .toBeGreaterThanOrEqual(2);
    expect(await player.evaluate((el: HTMLVideoElement) => el.duration)).toBeGreaterThan(200);
    await expect
      .poll(() => player.evaluate((el: HTMLVideoElement) => el.currentTime), { timeout: 10000 })
      .toBeGreaterThan(0);
  });
});
