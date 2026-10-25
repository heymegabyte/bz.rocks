import { describe, it, expect } from 'vitest';
import { TRACKS } from './data';
import { deriveTags } from './tags-derive';
import { STATIC_TAGS } from './tags-static';
import { TRACK_TAGS } from './tags';

// tags-static.ts is PRECOMPUTED (scripts/gen-track-tags.mjs). This guards that it
// stays IN SYNC with the live derivation + rules — if lyrics or the tag rules in
// tags-derive.ts change without regenerating, this fails (run `npm run gen:tags`).
describe('tags-static matches the live derivation', () => {
  it('every track has precomputed tags', () => {
    expect(Object.keys(STATIC_TAGS).length).toBe(TRACKS.length);
  });

  it('deriveTags(track) deep-equals the precomputed STATIC_TAGS entry', () => {
    for (const t of TRACKS) {
      expect(deriveTags(t), `tags drift for ${t.id} — run \`npm run gen:tags\``).toEqual(STATIC_TAGS[t.id]);
    }
  });

  it('TRACK_TAGS (the runtime map) carries the precomputed tags', () => {
    expect(TRACK_TAGS.size).toBe(TRACKS.length);
    const sample = TRACK_TAGS.get('border-mercy');
    expect(sample?.trackId).toBe('border-mercy');
    expect(Array.isArray(sample?.moods)).toBe(true);
  });
});
