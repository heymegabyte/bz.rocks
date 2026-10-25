import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const gotoHome = async (page: Page) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#heroTitle', { state: 'visible', timeout: 15000 });
};

const openChat = async (page: Page) => {
  const fab = page.locator('[data-aichat="fab"]').first();
  await expect(fab).toBeVisible();
  await fab.click({ force: true });
  const panel = page.locator('[data-aichat="panel"]').first();
  await expect(panel).toHaveAttribute('aria-hidden', 'false');
  return panel;
};

const sendSlash = async (page: Page, cmd: string) => {
  const input = page.locator('[data-aichat="input"]').first();
  await input.fill(cmd);
  await page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>('[data-aichat="composer"]');
    form?.requestSubmit();
  });
};

test.describe('AI chat — widget renderer', () => {
  test.beforeEach(async ({ context }) => {
    await context.route(/cloudflareinsights\.com|cdn-cgi\/challenge-platform|cdn-cgi\/speculation/, r =>
      r.abort()
    );
  });

  test('Cmd+I opens the chat panel from any focus', async ({ page }) => {
    await gotoHome(page);
    await page.locator('body').click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+i' : 'Control+i');
    await expect(page.locator('[data-aichat="panel"]').first()).toHaveAttribute('aria-hidden', 'false');
  });

  test('/shortcommands palette is keyboard-actionable', async ({ page }) => {
    await gotoHome(page);
    await openChat(page);
    await sendSlash(page, '/shortcommands');
    const palette = page.locator('.aichat__widget--palette').first();
    await expect(palette).toBeAttached({ timeout: 8000 });
    await expect(palette).toHaveAttribute('aria-label', /command palette/i);
    const buttons = palette.locator('[data-aichat-cmd]');
    expect(await buttons.count()).toBeGreaterThan(5);
  });

  test('tapping a chat track-card PLAYS it in-place (chat stays open)', async ({ page }) => {
    await gotoHome(page);
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {}); // clear autoplay prompt so play() isn't blocked
    await openChat(page);
    await sendSlash(page, '/track bermuda-prophecy');
    const card = page.locator('.aichat__widget--track, .aichat__widget--audio').first();
    await expect(card).toBeVisible({ timeout: 8000 });
    await expect(card).toHaveAttribute('data-track-id', 'bermuda-prophecy');
    await card.click();
    // The DJ's pick starts playing in the persistent player...
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
            return !!a && !a.paused && (a.currentSrc || '').includes('bermuda-prophecy');
          }),
        { timeout: 8000 }
      )
      .toBe(true);
    // ...and the chat panel stays open (no navigation away from the conversation).
    await expect(page.locator('[data-aichat="panel"]').first()).toHaveAttribute(
      'aria-hidden',
      'false'
    );
  });

  test('/album renders a playable tracklist with one-tap "Play as a set"', async ({ page }) => {
    await gotoHome(page);
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await openChat(page);
    await sendSlash(page, '/album signals');
    // The album's tracks render as playable cards...
    const cards = page.locator('.aichat__widget--track, .aichat__widget--audio');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    // ...and a single "Play as a set" button loads the whole album as a queue.
    const setBtn = page.locator('.aichat__playset').first();
    await expect(setBtn).toBeVisible();
    await expect(setBtn).toContainText(/play all \d+ as a set/i);
    await setBtn.click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
            return !!a && !a.paused;
          }),
        { timeout: 8000 }
      )
      .toBe(true);
    await expect(page.locator('[data-aichat="panel"]').first()).toHaveAttribute(
      'aria-hidden',
      'false'
    );
  });

  test('/stats emits chart + comparison-table widgets or graceful empty state', async ({ page }) => {
    await gotoHome(page);
    await openChat(page);
    await sendSlash(page, '/stats');
    const lastAi = page.locator('.aichat__msg.aichat__msg--ai').last();
    await expect(lastAi).toBeAttached({ timeout: 8000 });
    const chart = lastAi.locator('.aichat__widget--chart');
    const cmp = lastAi.locator('.aichat__widget--cmp');
    const emptyText = await lastAi.textContent();
    const hasChart = (await chart.count()) > 0;
    const hasCmp = (await cmp.count()) > 0;
    const isWarming = /warming up|could not load|stats fetch failed/i.test(emptyText || '');
    expect(hasChart || hasCmp || isWarming).toBe(true);
    if (hasChart) {
      await expect(chart).toHaveAttribute('aria-label', /.+/);
    }
  });

  test('Escape closes the panel and Cmd+I reopens it', async ({ page }) => {
    await gotoHome(page);
    const panel = await openChat(page);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+i' : 'Control+i');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  test('palette widget links use safe hrefs only', async ({ page }) => {
    await gotoHome(page);
    await openChat(page);
    await sendSlash(page, '/shortcommands');
    const palette = page.locator('.aichat__widget--palette').first();
    await expect(palette).toBeAttached({ timeout: 8000 });
    const html = await palette.innerHTML();
    expect(html).not.toMatch(/href=["']javascript:/i);
    expect(html).not.toMatch(/href=["']data:/i);
    expect(html).not.toContain('<script');
  });

  test('a PROSE track recommendation is auto-carded tap-to-play (grounded backstop)', async ({
    page
  }) => {
    await gotoHome(page);
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {}); // clear autoplay prompt so the tap-to-play play() isn't blocked
    await openChat(page);
    // Free-text (NOT a slash command): the fast model answers in prose with no
    // ```aiwidgets``` block, so the pick would be a dead-end sentence. The grounded
    // backstop must still surface a tap-to-play card for the verbatim catalog title.
    await sendSlash(page, 'Tell me about the song One Stop Higher.');
    const reply = page.locator('.aichat__msg.aichat__msg--ai').last();
    await expect(reply).toBeAttached({ timeout: 10000 });
    // Let the stream finish + the backstop attach (poll up to ~34s for the live model).
    let replyText = '';
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(1400);
      replyText = (await reply.textContent()) || '';
      if (/one stop higher/i.test(replyText)) break;
      if (/throttl|could not|unavailable|rate.?limit|try again/i.test(replyText)) break;
    }
    // AI threw/throttled this run → nothing to assert about the backstop; skip.
    test.skip(
      !/one stop higher/i.test(replyText),
      'model did not name the track this run (throttled or rephrased)'
    );
    // The title IS in the reply → the backstop MUST have carded it (deterministic).
    const card = page.locator('.aichat__widget--track[data-track-id="one-stop-higher"]');
    await expect(card).toBeAttached({ timeout: 8000 });
    // And it's genuinely actionable: tapping plays it in the persistent player.
    await card.first().click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const a = document.querySelector('audio[data-engine="bz"]') as HTMLAudioElement | null;
            return !!a && !a.paused && (a.currentSrc || '').includes('one-stop-higher');
          }),
        { timeout: 8000 }
      )
      .toBe(true);
  });
});
