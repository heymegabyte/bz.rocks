import { test, expect } from '@playwright/test';
import { attachConsoleGuard, assertClean } from './helpers/console-guard';

// Contact card — the compact "reach a human" surface shared by /about, /press,
// privacy + terms. Every tile must be a real 1-tap channel (mailto/tel/https)
// naming a real person, sized as a touch target, and identical across pages.
const SURFACES = ['about', 'press', 'privacy', 'terms'] as const;

test.describe('contact card', () => {
  for (const slug of SURFACES) {
    test(`${slug} renders a clean, tappable contact card`, async ({ page }) => {
      const captured = attachConsoleGuard(page);
      await page.goto(`/${slug}`, { waitUntil: 'domcontentloaded' });
      const card = page.locator('.contact-card').first();
      await expect(card).toBeVisible({ timeout: 20000 });

      // Identity: a real named human, not a label.
      await expect(card.locator('.contact-card__who strong')).toHaveText('Brian Zalewski');
      await expect(card.locator('.contact-card__avatar')).toHaveText('bZ');

      // At least two real channels; every one a mailto/tel/https.
      const chans = card.locator('a.contact-card__chan');
      expect(await chans.count()).toBeGreaterThanOrEqual(2);
      const hrefs = await chans.evaluateAll(els => els.map(e => e.getAttribute('href') ?? ''));
      for (const href of hrefs) expect(href).toMatch(/^(mailto:|tel:|https:\/\/)/);

      // Compact + touch-safe: every tile is >= 44px tall.
      const box = await card.boundingBox();
      expect(box?.height ?? 0).toBeLessThan(340);
      for (const el of await chans.elementHandles()) {
        const b = await el.boundingBox();
        expect(b?.height ?? 0).toBeGreaterThanOrEqual(44);
      }

      assertClean(captured, `/${slug}`);
    });
  }

  test('/about intent tiles open distinct pre-filled targets', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    const card = page.locator('.contact-card').first();
    await expect(card).toBeVisible({ timeout: 20000 });
    const hrefFor = (kind: string) => card.locator(`a.contact-card__chan[data-kind="${kind}"]`);
    await expect(hrefFor('email')).toHaveAttribute('href', 'mailto:brian@megabyte.space');
    await expect(hrefFor('press')).toHaveAttribute('href', /^mailto:brian@megabyte\.space\?subject=/);
    await expect(hrefFor('booking')).toHaveAttribute('href', /^mailto:brian@megabyte\.space\?subject=/);
    await expect(hrefFor('call')).toHaveAttribute('href', 'tel:+14696943696');
    await expect(hrefFor('studio')).toHaveAttribute('href', 'https://megabyte.space/connect/');
  });
});
