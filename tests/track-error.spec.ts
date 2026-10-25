import { test, expect } from '@playwright/test';

// Designed error state: a track that genuinely fails to load — after the engine's single
// self-heal retry — must surface an error + auto-skip so the session keeps flowing, NOT
// dead-stop silently. We force every /audio/*.mp3 to fail (network abort) and assert the
// toast + the auto-advance off the broken track. Runs on PROD.

const curId = () =>
  document.querySelector('.trackrow.is-current')?.getAttribute('data-track') ?? null;

test.describe('track-load failure recovery', () => {
  test('a failed track surfaces a toast and auto-skips (no silent dead-stop)', async ({ page }) => {
    // Every audio request fails — simulates a broken file / network drop.
    await page.route('**/audio/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    await page.locator('.trackrow').first().click();
    const firstId = await page.evaluate(curId);
    expect(firstId, 'a track was selected').toBeTruthy();

    // The engine errors, retries once (~700ms), errors again → surfaces an error toast.
    await page.waitForFunction(
      () => {
        const t = document.getElementById('wisdomToast');
        return (
          !!t &&
          t.classList.contains('is-visible') &&
          /skip|couldn't load|connection/i.test(t.textContent || '')
        );
      },
      { timeout: 15000 }
    );
    const toast = (await page.textContent('#wisdomToast')) ?? '';
    expect(toast).toMatch(/skip|couldn't load|connection/i);

    // And it auto-advanced OFF the broken track (didn't dead-stop on it).
    await page.waitForFunction(
      prev => {
        const c = document.querySelector('.trackrow.is-current')?.getAttribute('data-track');
        return c && c !== prev;
      },
      firstId,
      { timeout: 15000 }
    );
    const after = await page.evaluate(curId);
    expect(after).not.toBe(firstId);
  });
});
