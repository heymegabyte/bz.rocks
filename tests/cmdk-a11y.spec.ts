import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Cmd+K palette a11y + handler regression guard.
//
// The search results container (#cmdkResults) is NOT the listbox. A listbox may
// only own role=option / role=group children, so the suggest chips (above) and
// the AI "Play as a set" button (below) are interactive non-option content and
// would trip the serious `aria-required-children` axe rule if they lived in a
// role=listbox. Fix: an INNER #cmdkListbox[role=listbox] wraps ONLY the option
// rows; the chips + set-button stay inside #cmdkResults but OUTSIDE the listbox,
// so the single delegated #cmdkResults click handler is unchanged.
//
// This spec proves: (1) axe-clean in BOTH the fresh-open (suggest chips) AND the
// vibe-query (AI picks + set button) states; (2) the listbox owns only
// option/group children; (3) every handler still fires (suggest chip fills+runs,
// a track option plays, the set button plays the set, keyboard nav works).
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const MOOD = 'late night prayer drive';

async function openPalette(page: Page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const close = page.locator('#apClose');
  if (await close.isVisible().catch(() => false)) await close.click();
  await page.locator('#btnSearch').click();
  await expect(page.locator('#cmdk')).toHaveClass(/is-open/);
  await expect(page.locator('#cmdkInput')).toBeFocused();
}

async function cmdkBlockingViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .include('#cmdk')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
}

test.describe('Cmd+K palette — a11y + handlers', () => {
  test('fresh-open state is axe-clean and suggest chips run the query', async ({ page }) => {
    await openPalette(page);
    // Empty-state launchpad shows the vibe/mood/lyric suggest chips.
    await expect(page.locator('.cmdk__suggest-chip').first()).toBeVisible();

    const blocking = await cmdkBlockingViolations(page);
    if (blocking.length) for (const v of blocking) console.log(`  ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`);
    expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);

    // The chip is a real button inside #cmdkResults (but outside the listbox):
    // clicking it fills the input and runs the query.
    const chip = page.locator('.cmdk__suggest-chip').first();
    const q = (await chip.getAttribute('data-suggest')) || '';
    expect(q.length).toBeGreaterThan(0);
    await chip.click();
    await expect(page.locator('#cmdkInput')).toHaveValue(q);
    await expect(page.locator('#cmdkListbox .cmdk__item').first()).toBeVisible({ timeout: 12000 });
  });

  test('vibe-query state (AI picks + set button) is axe-clean; listbox owns only option/group', async ({
    page
  }) => {
    await openPalette(page);
    await page.locator('#cmdkInput').fill(MOOD);
    // AI picks arrived → the "Play as a set" action renders (outside the listbox).
    await expect(page.locator('.cmdk__set-btn')).toBeVisible({ timeout: 15000 });

    const blocking = await cmdkBlockingViolations(page);
    if (blocking.length) for (const v of blocking) console.log(`  ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`);
    expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);

    // Structural invariant: EVERY direct child of the listbox is a group heading
    // or an option — never a button/other interactive node.
    const childRoles = await page.locator('#cmdkListbox > *').evaluateAll(els =>
      els.map(el => ({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), cls: el.className }))
    );
    expect(childRoles.length).toBeGreaterThan(0);
    for (const c of childRoles) {
      const ok = c.role === 'option' || c.cls.includes('cmdk__group');
      expect(ok, `listbox child <${c.tag} role=${c.role} class="${c.cls}"> must be option or group`).toBe(true);
    }
    // The set button is a sibling of the listbox, inside #cmdkResults.
    await expect(page.locator('#cmdkResults > .cmdk__ai-action .cmdk__set-btn')).toHaveCount(1);
    await expect(page.locator('#cmdkListbox .cmdk__set-btn')).toHaveCount(0);
  });

  test('a track option plays; the set button plays the set', async ({ page }) => {
    await openPalette(page);
    await page.locator('#cmdkInput').fill(MOOD);
    await expect(page.locator('.cmdk__set-btn')).toBeVisible({ timeout: 15000 });

    // Click a real option row → it plays + the palette closes.
    await page.locator('#cmdkListbox .cmdk__item[role="option"]').first().click();
    await expect(page.locator('#cmdk')).not.toHaveClass(/is-open/, { timeout: 8000 });
    await expect(page.locator('#transportNpTitle')).not.toHaveText('', { timeout: 10000 });

    // Re-open, run the query, play the whole AI set from the out-of-listbox button.
    await page.locator('#btnSearch').click();
    await expect(page.locator('#cmdk')).toHaveClass(/is-open/);
    await page.locator('#cmdkInput').fill(MOOD);
    await expect(page.locator('.cmdk__set-btn')).toBeVisible({ timeout: 15000 });
    await page.locator('.cmdk__set-btn').click();
    await expect(page.locator('#cmdk')).not.toHaveClass(/is-open/, { timeout: 8000 });
    await expect(page.locator('#transportNpTitle')).not.toHaveText('', { timeout: 10000 });
  });

  test('keyboard nav highlights an option and Enter plays it', async ({ page }) => {
    await openPalette(page);
    await page.locator('#cmdkInput').fill('mercy');
    await expect(page.locator('#cmdkListbox .cmdk__item[role="option"]').first()).toBeVisible({ timeout: 12000 });
    await page.locator('#cmdkInput').press('ArrowDown');
    await page.locator('#cmdkInput').press('Enter');
    await expect(page.locator('#cmdk')).not.toHaveClass(/is-open/, { timeout: 8000 });
    await expect(page.locator('#transportNpTitle')).not.toHaveText('', { timeout: 10000 });
  });
});
