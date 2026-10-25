import { test, expect } from '@playwright/test';

// Interconnectedness: a /watch film page must not dead-end — it links to every
// OTHER track that has a cinematic film (server-rendered from real Track.video
// entries, so it auto-grows as more films ship). Grounded + crawlable; asserted
// at the HTML level (SSR), so this is fast + deterministic. Runs on PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';

// The two tracks that currently carry a film. Each page must link to the OTHER.
const FILMS = ['border-mercy', 'bermuda-prophecy'];

test.describe('/watch — cross-film navigation (More films)', () => {
  for (const id of FILMS) {
    test(`"${id}" links to every other film and not itself`, async ({ request }) => {
      const r = await request.get(`${BASE}/watch/${id}`);
      expect(r.status()).toBe(200);
      const html = await r.text();
      expect(html).toContain('More films');
      // Never links to its own /watch page in the More-films row.
      const others = FILMS.filter(f => f !== id);
      for (const other of others) {
        expect(html, `expected a More-films link to ${other}`).toContain(`/watch/${other}"`);
      }
      // The current film is excluded from the row (no self-link card).
      const rowMatch = html.match(/class="film-more__row">([\s\S]*?)<\/div><\/section>/);
      if (rowMatch) expect(rowMatch[1]).not.toContain(`/watch/${id}"`);
    });
  }
});
