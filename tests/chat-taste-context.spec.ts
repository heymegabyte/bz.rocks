import { test, expect, type Page } from '@playwright/test';

// The DJ chat personalizes on the listener's OWN history: recently-played
// (bz:recents) + accumulated all-time favorites (bz:listenStats, most-played).
// Both are injected into the chat's system prompt (trackContext) so the DJ
// recommends to real taste. This asserts the prompt ACTUALLY carries them —
// deterministic (checks the request the client builds, not the AI's reply).
// (Regression guard for a prior bug: ai-chat read the non-existent key
// `bz:recent` instead of `bz:recents`, so the recents context was always empty.)
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function seedAndOpenChat(page: Page) {
  // Seed the listener's history BEFORE any app script reads localStorage.
  await page.addInitScript(() => {
    localStorage.setItem(
      'bz:recents',
      JSON.stringify(['border-mercy', 'i-killed-your-dragon'])
    );
    localStorage.setItem(
      'bz:listenStats',
      JSON.stringify({
        'bermuda-prophecy': { starts: 12, replays: 4, completes: 5, skips: 0, secondsListened: 600, lastPlayAt: 1 },
        'cbo-pen': { starts: 8, replays: 2, completes: 3, skips: 1, secondsListened: 400, lastPlayAt: 1 }
      })
    );
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
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
  await page.keyboard.press('Meta'); // warm the lazy ai-chat mount
  await page.locator('[data-aichat="fab"]').click();
  await expect(page.locator('body.has-aichat-open')).toHaveCount(1, { timeout: 8000 });
}

test.describe('DJ chat personalization context (recents + all-time taste)', () => {
  test('the system prompt carries the listener recents AND most-played favorites', async ({
    page
  }) => {
    await seedAndOpenChat(page);

    const reqP = page.waitForRequest(
      r => r.url().includes('/api/ai/chat') && r.method() === 'POST',
      { timeout: 15000 }
    );
    const input = page.locator('[data-aichat="input"]');
    await input.click();
    await input.fill('what should I play next?');
    await page.locator('[data-aichat="send"]').click();

    const req = await reqP;
    const body = JSON.parse(req.postData() || '{}') as { system?: string };
    const system = body.system ?? '';

    // Recently-played context is present (the fixed bz:recents key) + names a seeded track.
    expect(system, 'recents line').toContain('Recently played');
    expect(system, 'recents title').toContain('Border Mercy');
    // All-time taste context is present + leads with the most-played track + its count.
    expect(system, 'taste line').toContain('most-played all-time');
    expect(system, 'top track + count').toContain('Bermuda Prophecy (12×)');
  });
});
