import { test, expect } from '@playwright/test';

// PWA offline awareness: the shell loads offline (SW precache) but audio isn't cached, so
// offline is browse-only. A proactive indicator must appear when the connection drops (and
// clear on reconnect) — the "offline" state first-time-excellence requires. Runs on PROD.

test.describe('offline indicator', () => {
  test('appears when the connection drops and clears on reconnect', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(800);
    const banner = page.locator('#netBanner');
    await expect(banner).toBeHidden();

    // Drop the connection → the offline pill appears with a clear message.
    await context.setOffline(true);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/offline/i);

    // Reconnect → a brief "Back online" confirmation, then it auto-hides.
    await context.setOffline(false);
    await expect(banner).toContainText(/back online/i);
    await expect(banner).toBeHidden({ timeout: 6000 });
  });
});
