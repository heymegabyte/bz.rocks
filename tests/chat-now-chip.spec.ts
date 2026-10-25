import { test, expect, type Page } from '@playwright/test';

// Context-aware DJ-chat welcome chip — when a track is playing, the chat's empty
// state surfaces a chip that NAMES the current track ("✦ Story behind <title>")
// and sends a track-named prompt, so the flagship AI chat is about what you're
// actually playing (grounded — the DJ answers from the catalog in its system
// prompt). Static chips remain; this one is prepended + accent-tinted.
//
// NOTE: ai-chat.ts lazy-mounts on first interaction or ~2s idle, and the chip is
// personalized by the mounted module's rAF loop — so wait for the chip's
// data-prompt to name the track (that IS the "mounted + personalized" signal)
// before opening the drawer.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

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
  // Lone modifier keydown nudges the lazy ai-chat mount without firing a shortcut.
  await page.keyboard.press('Meta');
}

test.describe('Context-aware DJ-chat welcome chip', () => {
  test('names the current track and carries a track-named prompt', async ({ page }) => {
    await gotoTrackAndWarm(page);
    const nowChip = page.locator('[data-aichat="nowChip"]');
    // ai-chat mounted + refreshNow personalized the chip to THIS track.
    await expect(nowChip).toHaveAttribute('data-prompt', new RegExp(TITLE), { timeout: 12000 });
    await expect(nowChip).toHaveText(new RegExp(TITLE));
    // Open the drawer via the FAB and confirm the chip is shown alongside the statics.
    await page.locator('[data-aichat="fab"]').click();
    await expect(page.locator('body.has-aichat-open')).toHaveCount(1, { timeout: 8000 });
    await expect(nowChip).toBeVisible();
    await expect(page.locator('[data-aichat="chips"] button')).toHaveCount(7);
  });

  test('tapping it sends the track-named message into the conversation', async ({ page }) => {
    await gotoTrackAndWarm(page);
    const nowChip = page.locator('[data-aichat="nowChip"]');
    await expect(nowChip).toHaveAttribute('data-prompt', new RegExp(TITLE), { timeout: 12000 });
    await page.locator('[data-aichat="fab"]').click();
    await expect(page.locator('body.has-aichat-open')).toHaveCount(1, { timeout: 8000 });
    await expect(nowChip).toBeVisible();
    await nowChip.click();
    // The composer-submitted user message names the track.
    const userMsg = page.locator('.aichat__msg--user').filter({ hasText: TITLE }).first();
    await expect(userMsg).toBeVisible({ timeout: 10000 });
  });
});
