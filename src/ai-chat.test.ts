import { describe, it, expect } from 'vitest';
import { detectTrackMentions } from './ai-chat';
import { TRACK_BY_ID } from './data';

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
