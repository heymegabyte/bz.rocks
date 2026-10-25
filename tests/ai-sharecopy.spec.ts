import { test, expect, type APIRequestContext } from '@playwright/test';

// AI share caption — /api/sharecopy returns ONE catchy, GROUNDED social caption
// for a track or album (Workers AI, KV-cached 30d, fail-soft). It replaces the
// bland "Title — bZ" default across every share network. GROUNDED: only real
// catalog ids resolve (unknown → 404); the caption never leaks the prompt and
// stays within the social length cap. Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

async function sharecopy(request: APIRequestContext, qs: string) {
  return request.get(`${BASE}/api/sharecopy?${qs}`);
}

function assertCaptionShape(caption: string) {
  expect(caption.length).toBeGreaterThan(11);
  expect(caption.length).toBeLessThanOrEqual(180);
  // Must not leak the instruction phrasing or a model name (the artist's own
  // vocabulary like "gospel-rap" / "Newark hustle-gospel" is legit caption copy).
  expect(caption).not.toMatch(/drawing only on|output only the|interpret only what|never invent|claude|llama/i);
  // One line (the server takes the first line only).
  expect(caption).not.toContain('\n');
}

test.describe('AI share caption (/api/sharecopy)', () => {
  test('a real TRACK returns a grounded caption (or null), never leaks the prompt', async ({
    request
  }) => {
    const res = await sharecopy(request, 'track=bermuda-prophecy');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { caption?: string | null };
    expect('caption' in body).toBe(true);
    if (body.caption != null) assertCaptionShape(body.caption);
  });

  test('a real ALBUM returns a grounded caption (or null)', async ({ request }) => {
    const res = await sharecopy(request, 'album=signals');
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { caption?: string | null };
    expect('caption' in body).toBe(true);
    if (body.caption != null) assertCaptionShape(body.caption);
  });

  test('an unknown target is 404 (grounded — never invents)', async ({ request }) => {
    const res = await sharecopy(request, 'track=not-a-real-track-xyz');
    expect(res.status()).toBe(404);
  });

  // Browser-only: the dialog surfaces an editable caption (generic immediately,
  // AI-upgraded when it lands) and every network link carries it. Runs under the
  // system-Chrome config (playwright.chrome.config.ts).
  test('share dialog shows a caption field wired into the network links', async ({ page }) => {
    await page.goto(`${BASE}/signals/bermuda-prophecy`, { waitUntil: 'domcontentloaded' });
    await page
      .locator('#apClose')
      .click({ timeout: 2000 })
      .catch(() => {});
    await page.locator('#btnShare').click({ timeout: 5000 });
    const cap = page.locator('#shareCaption');
    await expect(cap).toBeVisible();
    // Generic fallback is populated immediately so sharing always works.
    await expect(cap).not.toHaveValue('');
    // Every network intent carries the caption text — check X.
    await expect(page.locator('#shareXTwitter')).toHaveAttribute(
      'href',
      /twitter\.com\/intent\/tweet\?text=.+&url=/
    );
    // The AI caption lands + flips the ✦ AI tag on (cached, so quick); soft-wait.
    await expect(page.locator('#shareCaptionTag')).toBeVisible({ timeout: 6000 });
  });
});
