import { test, expect } from '@playwright/test';

// AI share captions (/api/sharecopy) are the distribution surface — every share.
// They must be CONCRETE + song-specific, never the generic "(hard) holy/gospel
// vibes/beats" formula that fits every bZ track (the prompt forbids it + a
// deterministic backstop backfills from the song's own lyric when the model
// still goes generic). Captions are KV-cached, so this assertion is stable.
// Runs against PROD_URL like the rest of the suite.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// The banned generic formula — mirrors GENERIC_CAP in worker/index.ts.
const GENERIC = /\b(?:hard\s+)?(?:holy|gospel)\s+(?:vibes?|beats?)\b/i;

const TRACKS = [
  'chef-lu-stew',
  'i-killed-your-dragon',
  'cbo-pen',
  'bermuda-slipstream',
  'one-stop-higher'
];

test.describe('AI share captions (/api/sharecopy)', () => {
  for (const id of TRACKS) {
    test(`"${id}" caption is concrete, not the generic holy/gospel-vibes formula`, async ({
      request
    }) => {
      const r = await request.get(`${BASE}/api/sharecopy?track=${id}`);
      expect(r.status()).toBe(200);
      const caption = ((await r.json()) as { caption?: string | null }).caption;
      // Fail-soft is allowed (null when AI is down) — but when present it must be
      // real, specific copy, never the banned formula.
      if (caption == null) return;
      expect(typeof caption).toBe('string');
      expect(caption.length).toBeGreaterThan(11);
      expect(caption.length).toBeLessThanOrEqual(180);
      expect(caption, `generic caption for ${id}: ${caption}`).not.toMatch(GENERIC);
    });
  }

  test('an unknown track 404s (grounded — never invents a caption)', async ({ request }) => {
    const r = await request.get(`${BASE}/api/sharecopy?track=not-a-real-track-xyz`);
    expect(r.status()).toBe(404);
  });
});
