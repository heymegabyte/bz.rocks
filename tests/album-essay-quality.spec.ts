import { test, expect } from '@playwright/test';

// AI album essays (/api/album-essay) are the "about this drop" read on each album
// card. They must LEAD with the album's specific tracks/imagery, never generic
// music-essay scaffolding that fits any album ("weaves a narrative of struggle
// and redemption", "is a testament to …") — which dominated ~40-47% of drafts.
// The prompt forbids those frames + a regenerate-once backstop enforces it.
// Essays are KV-cached, so this assertion is stable. Runs on PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// The banned generic frames — mirrors BANNED_FRAME in worker/index.ts (the
// hard-backstopped invariant; the "sets the tone" opener is only soft-nudged).
const FRAME = /\bweav(?:e|es|ing)\b[^.]{0,20}\bnarrative\b|\ba testament to\b/i;

const ALBUMS = ['desiiignare', 'mercy-drop', 'signals', 'flawless-execution'];

test.describe('AI album essays (/api/album-essay)', () => {
  for (const id of ALBUMS) {
    test(`"${id}" essay is track-specific, not generic narrative/testament scaffolding`, async ({
      request
    }) => {
      const r = await request.get(`${BASE}/api/album-essay?album=${id}`);
      expect(r.status()).toBe(200);
      const essay = ((await r.json()) as { essay?: string | null }).essay;
      // Fail-soft is allowed (null when AI is down); when present it must be real
      // prose free of the banned interchangeable scaffolding.
      if (essay == null) return;
      expect(typeof essay).toBe('string');
      expect(essay.length).toBeGreaterThan(19);
      expect(essay, `generic-framed essay for ${id}: ${essay}`).not.toMatch(FRAME);
    });
  }

  test('an unknown album 404s (grounded — never invents an essay)', async ({ request }) => {
    const r = await request.get(`${BASE}/api/album-essay?album=not-a-real-album-xyz`);
    expect(r.status()).toBe(404);
  });
});
