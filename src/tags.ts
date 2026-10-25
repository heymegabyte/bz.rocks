/**
 * Semantic tags per track (mood / theme / place / genre / identifiers). The tags
 * are PRECOMPUTED at build into `tags-static.ts` (see `tags-derive.ts` for the
 * derivation + `scripts/gen-track-tags.mjs` for the generator) — so the client
 * imports the result instead of deriving them from lyrics at module-load. This
 * keeps the 168×-regex derivation off the boot path AND lets the (large) lyrics
 * stay out of the client bundle. This file holds only the type + query helpers.
 */
import { STATIC_TAGS } from './tags-static';

export interface TrackTags {
  trackId: string;
  album: string;
  moods: string[];
  themes: string[];
  places: string[];
  genres: string[];
  energy: 'low' | 'mid' | 'high';
  tempo: 'slow' | 'medium' | 'fast';
  contains: string[];
  identifiers: { slug: string; albumSlug: string; hash: string; bpmHint: number };
}

/** Precomputed tag map, keyed by `Track.id`. */
export const TRACK_TAGS: Map<string, TrackTags> = new Map(Object.entries(STATIC_TAGS));

/** Lookup the tags for a track. Returns `undefined` for unknown IDs. */
export function getTrackTags(trackId: string): TrackTags | undefined {
  return TRACK_TAGS.get(trackId);
}

/**
 * Find every track that matches `tag` in any of mood/theme/place/genre/contains.
 * Tag namespaces are not enforced — passing `'sacred'` matches the mood,
 * passing `'panda'` matches a `contains` flag. Order matches `TRACKS`.
 */
export function tracksByTag(tag: string): string[] {
  const hits: string[] = [];
  for (const [id, t] of TRACK_TAGS) {
    if (
      t.moods.includes(tag) ||
      t.themes.includes(tag) ||
      t.places.includes(tag) ||
      t.genres.includes(tag) ||
      t.contains.includes(tag)
    ) {
      hits.push(id);
    }
  }
  return hits;
}

/** Collect the union of tags across all tracks, partitioned by namespace. */
export function allTags(): {
  moods: Set<string>;
  themes: Set<string>;
  places: Set<string>;
  genres: Set<string>;
} {
  const moods = new Set<string>();
  const themes = new Set<string>();
  const places = new Set<string>();
  const genres = new Set<string>();
  for (const t of TRACK_TAGS.values()) {
    t.moods.forEach(m => moods.add(m));
    t.themes.forEach(m => themes.add(m));
    t.places.forEach(m => places.add(m));
    t.genres.forEach(m => genres.add(m));
  }
  return { moods, themes, places, genres };
}
