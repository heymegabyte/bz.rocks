import { test, expect } from '@playwright/test';

// AI Radio: an opt-in transport toggle that makes forward auto-advance flow to a
// vibe-SIMILAR track (via the cached /api/similar engine) instead of catalog order — a
// cohesive, endless radio. OFF by default; mutually exclusive with shuffle; fail-soft to
// catalog order. Runs on PROD.
//
// NB: the current-track ID is the `.trackrow.is-current` data-track attribute — NOT the
// audio filename (files are Title_Case `Chef_Lu_Stew.mp3`, ids are kebab `chef-lu-stew`).

async function playFirst(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .locator('#apClose')
    .click({ timeout: 2000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('.trackrow').first().click();
  await page.waitForTimeout(1500);
}

const curId = () =>
  document.querySelector('.trackrow.is-current')?.getAttribute('data-track') ?? null;

test.describe('AI Radio', () => {
  test('toggles on, is mutually exclusive with shuffle, and persists', async ({ page }) => {
    await playFirst(page);
    const radio = page.locator('#btnAiRadio');
    const shuffle = page.locator('#btnShuffle');
    await expect(radio).toBeVisible();

    await radio.click();
    await expect(radio).toHaveClass(/is-on/);
    await expect(radio).toHaveAttribute('aria-pressed', 'true');

    // Turning shuffle ON turns AI Radio OFF (one flow mode at a time). Shuffle is hidden
    // on mobile (AI Radio takes its slot), so this UI check only runs where it's visible.
    if (await shuffle.isVisible()) {
      await shuffle.click();
      await expect(shuffle).toHaveClass(/is-on/);
      await expect(radio).not.toHaveClass(/is-on/);
      await radio.click(); // re-enable for the persistence check below
    }

    // Reload — AI Radio persists (localStorage). Each test gets a fresh isolated context,
    // so no reset needed (the flag can't leak to the other test).
    await expect(radio).toHaveClass(/is-on/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#btnAiRadio')).toHaveClass(/is-on/);
  });

  test('with AI Radio on, advancing flows to a vibe-similar track (not catalog order)', async ({
    page
  }) => {
    await playFirst(page);
    const id = await page.evaluate(curId);
    expect(id, 'a track is playing').toBeTruthy();

    // The grounded similar set for the current track (what the radio should flow into).
    const sims = (await page.evaluate(async (t) => {
      const r = await fetch(`/api/similar?track=${encodeURIComponent(t as string)}`);
      if (!r.ok) return [];
      const d = (await r.json()) as { similar?: Array<{ id?: string }> };
      return (d.similar ?? []).map(s => s?.id).filter(Boolean);
    }, id)) as string[];
    expect(sims.length, 'similar engine returns picks').toBeGreaterThan(0);

    await page.locator('#btnAiRadio').click();
    await expect(page.locator('#btnAiRadio')).toHaveClass(/is-on/);

    // Advance — AI Radio jumps to one of the similar picks, not the catalog-next.
    await page.locator('#btnNext').click();
    await page.waitForFunction(
      prev => {
        const cur = document.querySelector('.trackrow.is-current')?.getAttribute('data-track');
        return cur && cur !== prev;
      },
      id,
      { timeout: 12000 }
    );
    const newId = await page.evaluate(curId);
    expect(newId).not.toBe(id);
    expect(sims, `advanced to a similar pick (${newId})`).toContain(newId);
    await page.locator('#btnAiRadio').click(); // reset
  });

  test('np-panel UP NEXT previews the SAME similar track it will play (+ an AI Radio label)', async ({
    page
  }) => {
    await playFirst(page);
    const id = await page.evaluate(curId);
    const sims = (await page.evaluate(async (t) => {
      const r = await fetch(`/api/similar?track=${encodeURIComponent(t as string)}`);
      if (!r.ok) return [];
      const d = (await r.json()) as { similar?: Array<{ id?: string }> };
      return (d.similar ?? []).map(s => s?.id).filter(Boolean);
    }, id)) as string[];
    expect(sims.length).toBeGreaterThan(0);
    const expectTitle = await page.evaluate(
      sid =>
        document.querySelector(`.trackrow[data-track="${sid}"] .trackrow__title`)?.textContent?.trim() ??
        '',
      sims[0]
    );

    // Enable AI Radio (panel closed), then open the np-panel. The cover art animates
    // (beat-sync), so a normal click never stabilizes — open it via a JS click.
    await page.locator('#btnAiRadio').click();
    await expect(page.locator('#btnAiRadio')).toHaveClass(/is-on/);
    await page.evaluate(() =>
      (document.getElementById('transportNpCover') as HTMLElement | null)?.click()
    );

    // UP NEXT previews the AI-Radio pick (matches what will play) + says "AI Radio".
    await expect(page.locator('#npPanelSegueTitle')).toHaveText(expectTitle, { timeout: 12000 });
    await expect(page.locator('#npPanelSegueEyebrow')).toContainText(/AI Radio/i);
  });

  test('prefetches the next pick ON PLAY (gapless advance) when AI Radio is on', async ({
    page
  }) => {
    const simReqs: string[] = [];
    page.on('request', r => {
      if (r.url().includes('/api/similar')) simReqs.push(r.url().split('track=')[1] ?? '');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    // Enable AI Radio FIRST, then play — /api/similar must be requested ON PLAY (the warm),
    // not only when the track ends, so advancing has no silent gap.
    await page.locator('#btnAiRadio').click();
    simReqs.length = 0;
    await page.locator('.trackrow').first().click();
    await page.waitForTimeout(2500);
    const id = await page.evaluate(curId);
    expect(simReqs.some(t => t === id), `prefetched /api/similar for ${id} on play`).toBeTruthy();
  });
});
