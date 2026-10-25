import { describe, it, expect } from 'vitest';
import { detectTrackMentions, detectAlbumMentions } from './ai-chat';
import { TRACK_BY_ID, ALBUM_BY_ID } from './data';

// The fast chat model usually recommends tracks in plain prose with no
// ```aiwidgets``` block. detectTrackMentions is the grounded backstop that turns
// a verbatim catalog-title mention into a tap-to-play track-card — so every
// recommendation is one tap from the persistent player. These assert it's
// grounded (only real titles), boundary-safe (no false positives), and capped.

describe('detectTrackMentions — grounded actionability backstop', () => {
  it('turns a prose recommendation of a real multi-word title into a tap-to-play card', () => {
    const w = detectTrackMentions('You should listen to "One Stop Higher" — it is about forgiveness.');
    expect(w.length).toBe(1);
    expect(w[0].kind).toBe('track-card');
    const c = w[0] as { trackId: string; title: string; href: string; album: string };
    expect(c.trackId).toBe('one-stop-higher');
    expect(c.href).toContain('/one-stop-higher'); // real route → tap-to-play
    expect(c.title).toBe('One Stop Higher'); // title from the real catalog, not the prose
    expect(c.album.length).toBeGreaterThan(0); // grounded album name present
  });

  it('detects multiple distinct real titles, deduped + capped', () => {
    const w = detectTrackMentions(
      'Try Chef Lu Stew, then I Killed Your Dragon, then Chef Lu Stew again.'
    );
    const ids = w.map(x => (x as { trackId: string }).trackId);
    expect(ids).toContain('chef-lu-stew');
    expect(ids).toContain('i-killed-your-dragon');
    expect(new Set(ids).size).toBe(ids.length); // no duplicate cards
    expect(w.length).toBeLessThanOrEqual(4); // capped
  });

  it('never fabricates a card for a title that is not in the catalog', () => {
    expect(detectTrackMentions('Check out "Diamond Rain Supernova" and "Gold".')).toEqual([]);
  });

  it('does not false-trigger on common short words that are not real track titles', () => {
    // ordinary prose must never spawn a card — single-word titles need ≥8 chars,
    // and album names (not tracks) are out of this index entirely.
    expect(
      detectTrackMentions('I appeal to the canon of scripture for mixed signals of hope today.')
    ).toEqual([]);
  });

  it('every returned card points at a track that genuinely exists', () => {
    const w = detectTrackMentions('One Stop Higher and I Killed Your Dragon are both great.');
    expect(w.length).toBeGreaterThan(0);
    for (const c of w) expect(TRACK_BY_ID.get((c as { trackId: string }).trackId)).toBeTruthy();
  });

  it('is fail-soft on junk input', () => {
    expect(detectTrackMentions('')).toEqual([]);
    expect(detectTrackMentions('hi')).toEqual([]);
    // @ts-expect-error — defends against a non-string at runtime
    expect(detectTrackMentions(null)).toEqual([]);
  });
});

describe('detectAlbumMentions — grounded album backstop', () => {
  it('turns a prose album recommendation into an album-card + its tracklist (play-all)', () => {
    const w = detectAlbumMentions('I gotchu! Start with Panda Desiiignare — the flagship gospel of bZ.');
    expect(w.length).toBeGreaterThan(1); // album-card + ≥1 track-card
    const card = w[0] as { kind: string; albumId: string; name: string; href: string; trackCount: number };
    expect(card.kind).toBe('album-card');
    expect(card.albumId).toBe('desiiignare');
    expect(card.href).toBe('/desiiignare');
    expect(card.name).toBe('Panda Desiiignare');
    // The rest are the album's real tracks (so renderWidgets adds "Play all as a set").
    const trackCards = w.slice(1);
    expect(trackCards.length).toBe(card.trackCount);
    for (const t of trackCards) {
      expect((t as { kind: string }).kind).toBe('track-card');
      expect(TRACK_BY_ID.get((t as { trackId: string }).trackId)).toBeTruthy();
    }
  });

  it('never fabricates an album card for a name not in the catalog', () => {
    expect(detectAlbumMentions('Check out the "Diamond Supernova" album.')).toEqual([]);
  });

  it('does NOT false-trigger on common "The Appeal" / "The Pause" prose', () => {
    // These two album names reduce to a common single word after "the" — they'd
    // false-fire on ordinary prose, so the stripped-"the" guard excludes them.
    expect(detectAlbumMentions('I love the appeal of this gospel record.')).toEqual([]);
    expect(detectAlbumMentions('There was a long pause, then the pause ended.')).toEqual([]);
  });

  it('DOES card a distinctive album even when another is only mentioned in prose', () => {
    const w = detectAlbumMentions('Try Little Lanterns or maybe the appeal of something quieter.');
    expect(w.length).toBeGreaterThan(0);
    expect((w[0] as { albumId: string }).albumId).toBe('little-lanterns');
    expect(ALBUM_BY_ID.get('little-lanterns')).toBeTruthy();
  });

  it('is capped + fail-soft', () => {
    // cap=1 → at most ONE album set regardless of how many are named.
    const w = detectAlbumMentions('Panda Desiiignare, Mercy Drop, and Little Lanterns are all great.');
    expect(w.filter(x => (x as { kind: string }).kind === 'album-card').length).toBe(1);
    expect(detectAlbumMentions('')).toEqual([]);
    // @ts-expect-error — defends against a non-string at runtime
    expect(detectAlbumMentions(null)).toEqual([]);
  });
});
