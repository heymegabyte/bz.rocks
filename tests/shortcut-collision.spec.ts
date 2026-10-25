import { test, expect, type Page } from '@playwright/test';

// Keyboard-shortcut ownership — ⌘K and ⌘/ must NOT collide.
// The search button advertises ⌘/ (opens the cmdk search overlay); the AI-chat
// FAB advertises ⌘K (opens the chat drawer). A prior bug bound BOTH ⌘K and ⌘/
// to openSearch() in main.ts while ai-chat.ts ALSO toggled the chat on ⌘K, so
// pressing ⌘K opened the search overlay AND the chat drawer at once — and the
// FAB's "⌘K" label was false. This guards the fixed 1:1 mapping.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function settle(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  // Dismiss the autoplay dialog if present (a modal dialog on top of the shell).
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
}

test.describe('Keyboard shortcut ownership (⌘K vs ⌘/)', () => {
  test('⌘K opens the AI chat drawer and NOT the search overlay', async ({ page }) => {
    await settle(page);
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(600);
    // Chat drawer is open...
    await expect(page.locator('body.has-aichat-open')).toHaveCount(1);
    await expect(page.locator('.aichat__panel.is-open')).toHaveCount(1);
    // ...and the search overlay is NOT open (the collision is gone).
    await expect(page.locator('#cmdk.is-open')).toHaveCount(0);
  });

  test('⌘/ opens the search overlay and NOT the chat drawer', async ({ page }) => {
    await settle(page);
    await page.keyboard.press('Meta+/');
    await page.waitForTimeout(600);
    // Search overlay is open...
    await expect(page.locator('#cmdk.is-open')).toHaveCount(1);
    // ...and the chat drawer is NOT open.
    await expect(page.locator('body.has-aichat-open')).toHaveCount(0);
  });
});
