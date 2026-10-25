import { test, expect } from '@playwright/test';

// /api/similar powers the np-panel "more like this" AND the Queue "AI" tab, so its
// reason quality is user-facing. It used to emit generic non-reasons ("Shared awakening
// theme", "escape theme", "St. John's reference") and near-dups (two Law-9 "Win through
// your actions…"), and could return 3 near-identical MIXES of one song. This guards the
// invariants of the hardening: distinct, concrete, non-"X theme" reasons. Runs on PROD
// (results are KV-cached, so this is fast + deterministic).

const TRACKS = ['border-mercy', 'i-killed-your-dragon', 'mama-called-us', 'wake-up-alice', 'chef-lu-stew'];

// Mirror of the server's non-reason backstop — a reason that's ONLY a genre label, a
// bare "X theme" / "Shared X", or an "X reference" says nothing concrete.
const NON_REASON =
  /^(?:(?:epic|latin|hard|holy|dark|raw)\s+)?gospel[\s-]?trap\b.*$|^(?:same|similar|shared|common|identical)\s+(?:vibe|sound|genre|energy|theme|mood|message|feel|tone|spirit)\b.*$|\b(?:theme|reference|mention)$/i;

const STOP = new Set([
  'the', 'a', 'an', 'to', 'of', 'your', 'my', 'our', 'their', 'his', 'her',
  'and', 'or', 'in', 'on', 'at', 'for', 'with', 'is', 'are', 'be', 'that', 'this'
]);
const normed = (w: string): string =>
  w.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x && !STOP.has(x)).join(' ');

test.describe('/api/similar — grounded, distinct, non-generic reasons', () => {
  for (const id of TRACKS) {
    test(`${id}: picks are distinct tracks with concrete, non-"X theme" reasons`, async ({
      request
    }) => {
      const res = await request.get(`/api/similar?track=${id}`);
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as { similar?: Array<{ id: string; why: string }> };
      const sim = body.similar ?? [];
      // Grounded picks returned (the engine fires for every real track).
      expect(sim.length).toBeGreaterThanOrEqual(2);

      const ids = new Set<string>();
      const whys: string[] = [];
      for (const s of sim) {
        expect(s.id, 'pick has an id').toBeTruthy();
        expect(s.id, 'never recommends the current track').not.toBe(id);
        expect(ids.has(s.id), `duplicate pick ${s.id}`).toBeFalsy();
        ids.add(s.id);
        // The reason is present + concrete (not a bare genre/theme/reference label).
        expect(s.why.trim().length, 'reason non-trivial').toBeGreaterThanOrEqual(4);
        expect(NON_REASON.test(s.why.trim()), `generic non-reason: "${s.why}"`).toBeFalsy();
        whys.push(s.why);
      }

      // Reasons are DISTINCT (prefix-aware, stopword-normalized) — no two restatements
      // of the same shared wisdom (the Law-9 near-dup class).
      const seen: string[] = [];
      for (const w of whys) {
        const n = normed(w);
        for (const s of seen) {
          expect(
            n === s || n.startsWith(s + ' ') || s.startsWith(n + ' '),
            `near-duplicate reasons: "${w}" vs an earlier one`
          ).toBeFalsy();
        }
        seen.push(n);
      }
    });
  }
});
