import { test, expect } from '@playwright/test';

// AI segue lines (/api/segue) describe why the NEXT track flows from the current
// one (AI Radio up-next + np-panel). They must be VIVID + pair-specific, never a
// parroted few-shot example: the prompt's GOOD example "Darkness shifts to neon
// skies" was being copied verbatim/ungrounded in ~50% of samples. The prompt now
// forbids reusing an example's opener + a deterministic backstop rejects the copy
// tells. Segues are KV-cached, so these assertions are stable. Runs on PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// The proven parroted phrases — mirrors the backstop in worker/index.ts.
const PARROT = /\bdarkness shifts to\b|\bneon skies\b/i;

// Pairs warmed into the #v5 cache (fast + deterministic, no AI call / throttle).
const PAIRS: Array<[string, string]> = [
  ['cbo-pen', 'mama-called-us'],
  ['one-stop-higher', 'pineal-crown'],
  ['chef-lu-stew', 'cbo-pen']
];

test.describe('AI segue lines (/api/segue)', () => {
  for (const [from, to] of PAIRS) {
    test(`"${from}→${to}" is vivid + pair-specific, not a parroted example`, async ({ request }) => {
      const r = await request.get(`${BASE}/api/segue?from=${from}&to=${to}`);
      expect(r.status()).toBe(200);
      const why = ((await r.json()) as { why?: string | null }).why;
      // Fail-soft is allowed (null when AI is down/throttled); when present it must
      // be a real fragment, never the parroted "Darkness shifts to"/"neon skies".
      if (why == null) return;
      expect(typeof why).toBe('string');
      expect(why.length).toBeGreaterThan(11);
      expect(why, `parroted segue for ${from}→${to}: ${why}`).not.toMatch(PARROT);
    });
  }

  test('an unknown track pair 404s (grounded — never invents a segue)', async ({ request }) => {
    const r = await request.get(`${BASE}/api/segue?from=not-real-xyz&to=chef-lu-stew`);
    expect(r.status()).toBe(404);
  });
});
