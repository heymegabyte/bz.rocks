import { test, expect } from '@playwright/test';

// Music Schema.org + entity-grounding guard (#5 + #10 Speakable).
//
// Server-rendered JSON-LD, so these assert against the fetched HTML (no browser
// nav needed). Three invariants:
//   1. Homepage MusicGroup `sameAs` lists ONLY verified profiles — the resolved
//      Spotify artist (0hDEU…) + real socials — and NONE of the former fabricated
//      URLs (wrong Spotify id, apple/us/artist/bz 404, invalid YT channel, etc.).
//      A sameAs that 404s / points at the wrong entity HURTS entity resolution.
//   2. Every track MusicRecording carries a ListenAction with EntryPoint targets
//      (surfaces "Listen" buttons in Google's Knowledge Panel / music carousel)
//      and a byArtist MusicGroup whose sameAs is the SAME verified Spotify artist.
//   3. Content pages carry a SpeakableSpecification (voice/AI read-aloud).
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const REAL_SPOTIFY = 'https://open.spotify.com/artist/0hDEUhE0QAh51cM1Fe2p3T';
const FABRICATED = [
  'open.spotify.com/artist/0Iiv5ohOcyXBKBWBC8E1eP', // a DIFFERENT real artist — not bZ
  'music.apple.com/us/artist/bz', // 404
  'UC-bZ-music', // invalid YouTube channel-id format
  'bz.bandcamp.com',
  'soundcloud.com/bz-music'
];

/** Pull + JSON.parse every <script type="application/ld+json"> block. */
function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      throw new Error(`Invalid JSON-LD block: ${m[1].slice(0, 120)}…`);
    }
  }
  return out;
}

test.describe('music Schema.org + entity grounding', () => {
  test('homepage MusicGroup sameAs is verified-only (no fabricated channels)', async ({
    request
  }) => {
    const html = await (await request.get(`${BASE}/?cb=${Date.now()}`)).text();
    for (const bad of FABRICATED) expect(html, `fabricated sameAs still present: ${bad}`).not.toContain(bad);
    const blocks = jsonLdBlocks(html);
    const group = blocks.find(
      (b): b is { '@type': string; sameAs?: string[] } =>
        !!b && typeof b === 'object' && (b as { '@type'?: string })['@type'] === 'MusicGroup'
    );
    expect(group, 'homepage MusicGroup JSON-LD present').toBeTruthy();
    expect(group!.sameAs).toContain(REAL_SPOTIFY);
  });

  test('track MusicRecording carries a ListenAction + verified byArtist', async ({ request }) => {
    const html = await (await request.get(`${BASE}/desiiignare/chef-lu-stew?cb=${Date.now()}`)).text();
    const blocks = jsonLdBlocks(html);
    const rec = blocks.find(
      (b): b is Record<string, unknown> =>
        !!b && typeof b === 'object' && (b as { '@type'?: string })['@type'] === 'MusicRecording'
    );
    expect(rec, 'MusicRecording JSON-LD present').toBeTruthy();
    const action = rec!.potentialAction as { '@type'?: string; target?: unknown[] } | undefined;
    expect(action?.['@type'], 'ListenAction present').toBe('ListenAction');
    expect(Array.isArray(action?.target) && action!.target!.length, 'ListenAction has targets').toBeTruthy();
    const byArtist = rec!.byArtist as { sameAs?: string[] } | undefined;
    expect(byArtist?.sameAs, 'byArtist sameAs is the verified Spotify artist').toContain(REAL_SPOTIFY);
  });

  test('content page carries a SpeakableSpecification', async ({ request }) => {
    const html = await (await request.get(`${BASE}/about?cb=${Date.now()}`)).text();
    const blocks = jsonLdBlocks(html);
    const page = blocks.find(
      (b): b is Record<string, unknown> =>
        !!b && typeof b === 'object' && (b as { '@type'?: string })['@type'] === 'WebPage'
    );
    expect(page, 'WebPage JSON-LD present').toBeTruthy();
    const sp = page!.speakable as { '@type'?: string; cssSelector?: string[] } | undefined;
    expect(sp?.['@type']).toBe('SpeakableSpecification');
    expect(Array.isArray(sp?.cssSelector) && sp!.cssSelector!.length).toBeTruthy();
  });
});
