import { test, expect, type Page } from '@playwright/test';

// Context-aware DJ-chat chip — the LOADED-but-not-playing path.
// A shared-link visitor can land on a track page and open the DJ BEFORE pressing
// play, so the audio engine has no track yet. The chip must still personalize —
// sourced from the SPA's routing-loaded track (getLoadedTrack), not playback.
// This whole file BLOCKS autoplay (top-level test.use — the only valid scope for
// launchOptions) so the ONLY possible source of the current track is the loaded one.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

test.use({
  launchOptions: { args: ['--mute-audio', '--autoplay-policy=document-user-activation-required'] }
});

const ALBUM = 'signals';
const TRACK = 'bermuda-prophecy';
const TITLE = 'Bermuda Prophecy';

async function gotoTrackAndWarm(page: Page) {
  await page.goto(`${BASE}/${ALBUM}/${TRACK}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#transportNpTitle')).toHaveText(TITLE, { timeout: 15000 });
  await page.evaluate(() => {
    const d = document.querySelector('#autoplayPrompt') as HTMLDialogElement | null;
    if (d) {
      try {
        d.close();
      } catch {
        /* not open */
      }
      d.remove();
    }
  });
  await page.keyboard.press('Meta'); // nudge the lazy ai-chat mount
}

test.describe('Context-aware chip — loaded-but-not-playing', () => {
  test('personalizes from the loaded track even before playback starts', async ({ page }) => {
    await gotoTrackAndWarm(page);
    // The now-strip stays hidden (nothing is playing — it rides the engine)...
    await expect(page.locator('[data-aichat="now"]')).toBeHidden();
    // ...but the chip still names the loaded track (sourced from getLoadedTrack).
    const nowChip = page.locator('[data-aichat="nowChip"]');
    await expect(nowChip).toHaveAttribute('data-prompt', new RegExp(TITLE), { timeout: 12000 });
    await expect(nowChip).toHaveText(new RegExp(TITLE));
  });
});
