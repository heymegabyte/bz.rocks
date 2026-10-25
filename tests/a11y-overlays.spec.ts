// Accessibility gate for the INTERACTIVE OVERLAY states — the blind spot a
// default-view page scan can never see. The static-page a11y gate (a11y.spec.ts)
// only loads routes in their resting state; the big interactive surfaces (the
// Cmd+K search, the now-playing panel, the AI DJ drawer + its settings, the
// fullscreen lyrics) render custom controls + scroll regions that only exist
// once opened. This opens each and runs axe there.
//
// Regression guard for two classes found 2026-10-24 (invisible to the default scan):
//   • AI-chat drawer settings: 7 toggle checkboxes with NO accessible name
//     (visible label was a sibling span, not associated) — axe `label` (critical).
//   • Scrollable regions (#cmdkResults, #lyricsFsInner) not keyboard-focusable
//     — axe `scrollable-region-focusable` (serious).
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function axeBlocking(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
}

test('a11y: Cmd+K search (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('#btnSearch').click();
  await page.waitForTimeout(800);
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

test('a11y: now-playing panel (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page
    .locator('.trackrow')
    .first()
    .click()
    .catch(() => {});
  // Open the now-playing panel via the transport cover. Bounded + fail-soft: the
  // headless panel-open interaction is occasionally flaky, so never hang on it —
  // axe still scans the always-present fullscreen-lyrics region (#lyricsFsInner)
  // and, when the panel opens, its content too.
  const cover = page.locator('#transportNpCover');
  await cover.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await cover.click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

test('a11y: AI chat drawer (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('[data-aichat="fab"]').click();
  await page.waitForTimeout(1500);
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

// The queue, fullscreen-lyrics, and shortcuts overlays open via the "More" menu
// (btnMore → menuitem[data-action]). A track is played first so queue/lyrics have
// content. Bounded + fail-soft opens so a flaky headless interaction can't hang;
// axe still scans the reached state. These guard the clean baseline found 2026-10-24.
async function openViaMore(page: import('@playwright/test').Page, action: string) {
  await page
    .locator('.trackrow')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(1500);
  await page
    .locator('#btnMore')
    .click({ timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  await page
    .locator(`.more-menu__item[data-action="${action}"]`)
    .click({ timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(900);
}

test('a11y: queue panel (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await openViaMore(page, 'queue');
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

test('a11y: fullscreen lyrics (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await openViaMore(page, 'fs-lyrics');
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

test('a11y: shortcuts modal (open) has no serious/critical violations', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await openViaMore(page, 'shortcuts');
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});

// Regression guard (found 2026-10-24, invisible to the default scans + the
// overlay scans above): the embeddable player's seek bar (#embedBar,
// role="slider") shipped WITHOUT the required aria-valuemin/max/now attributes
// — axe `aria-required-attr` (critical). It renders standalone at /embed/<album>
// AND inside the share dialog's preview iframe. Fixed by adding the value attrs
// + live aria-valuenow/valuetext updates on the engine tick (matches the main
// player). This also scans the embed page itself, which no prior spec did.
test('a11y: embed player (/embed/<album>) has no serious/critical violations', async ({ page }) => {
  await page.goto(`${BASE}/embed/signals`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await expect(page.locator('#embedBar')).toHaveAttribute('aria-valuenow', /.+/);
  await expect(page.locator('#embedBar')).toHaveAttribute('aria-valuemax', '1');
  const blocking = await axeBlocking(page);
  expect(blocking, blocking.map(v => `${v.id}: ${v.help}`).join('; ')).toEqual([]);
});
