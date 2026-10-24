import { test, expect } from '@playwright/test';

// The visualizer HUD BPM readout must match the authoritative Suno BPM shown in
// the transport bar — both derive from SUNO_META.sunoBpm (the build-time
// aubio-measured tempo). Regression guard for the bug where the HUD showed the
// LIVE in-browser beat estimate, which drifts to a 1.5×/2× harmonic (e.g. 214 for
// a 142-bpm track) while the transport correctly showed 142 — two contradicting
// BPMs on screen at once. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test('HUD BPM matches the transport Suno BPM (no harmonic drift)', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  // start playback from the first track row
  await page.locator('.trackrow').first().click();

  // transport Suno BPM populates once the track is loaded
  const transportBpm = page.locator('.transport__np-suno__bpm');
  await expect(transportBpm).toContainText(/\d+\s*BPM/i, { timeout: 15000 });
  // HUD BPM becomes numeric once the visualizer loop is running
  const hudBpm = page.locator('#hudBpm');
  await expect(hudBpm).toHaveText(/^\d+$/, { timeout: 15000 });
  // Let the live beat estimate fully settle — its harmonic drift lands within a
  // few seconds of playback, so a short wait races it (false green). Sampling at
  // ~10s is past the drift window: pre-fix the HUD reads the wrong harmonic here.
  await page.waitForTimeout(9000);

  const tBpm = parseInt(((await transportBpm.textContent()) || '').replace(/[^\d]/g, ''), 10);
  const hBpm = parseInt((await hudBpm.textContent()) || '0', 10);

  expect(tBpm).toBeGreaterThan(30);
  // Exact match — both read the same authoritative SUNO_META.sunoBpm.
  expect(hBpm).toBe(tBpm);
});
