import { test, expect } from '@playwright/test';

// The visualizer HUD musical readouts (BPM + KEY) must match the AUTHORITATIVE
// Suno values shown in the transport bar — both derive from SUNO_META (the
// build-time aubio-measured tempo + parsed key). Regression guards for two bugs
// of the same class, where the HUD showed a LIVE in-browser estimate instead:
//   • BPM drifted to a 1.5×/2× harmonic (e.g. 214 for a 142-bpm track).
//   • KEY showed the live peak-frequency note ("C#4") — mislabeled + redundant
//     with the PK (peak Hz) cell — instead of the song's musical key ("C#m").
// Both are constant per track, so the HUD must agree with the transport. PROD_URL.
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

test('HUD KEY shows the musical key (no octave digit), not the live peak note', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.locator('.trackrow').first().click();

  const hudKey = page.locator('#hudKey');
  await expect(hudKey).toHaveText(/\S/, { timeout: 15000 }); // populated (key or "—")
  await page.waitForTimeout(1500);

  const k = ((await hudKey.textContent()) || '').trim();
  // Regression signature: the old bug showed the live peak-frequency NOTE "C#4"
  // (note + OCTAVE DIGIT). A musical key ("C#m" / "A") or the unknown dash has none.
  expect(k).not.toMatch(/\d/);
  expect(k).toMatch(/^(—|[A-G][#b]?m?)$/);

  // When the transport shows an authoritative key, the HUD must agree on note + quality.
  const tKeyEl = page.locator('.transport__np-suno__key');
  if ((await tKeyEl.count()) > 0) {
    const tKey = ((await tKeyEl.textContent()) || '').trim().toLowerCase(); // e.g. "c# minor"
    if (tKey && k !== '—') {
      const note = (k.match(/^[A-G][#b]?/) || [''])[0].toLowerCase();
      expect(tKey.startsWith(note)).toBeTruthy();
      expect(tKey.includes('minor')).toBe(k.endsWith('m'));
    }
  }
});
