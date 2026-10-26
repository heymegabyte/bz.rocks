# Artist entity-home kit (MusicBrainz + Wikidata)

**Why:** the homepage/track JSON-LD now carries a grounded `sameAs` → the verified
Spotify artist (`0hDEUhE0QAh51cM1Fe2p3T`). The remaining lever for a Google
**Knowledge Panel** + reliable AI-engine citation is a reciprocal **entity home**
in the machine-readable authorities Google treats as music "trust anchors":
**MusicBrainz** + **Wikidata**. Once those exist and link back to bz.rocks +
Spotify, Google can resolve "who is bZ?" with confidence.

**Status (verified 2026-10-26, this repo):** bZ has **no** MusicBrainz entry (the
Spotify artist URL is linked to no MB artist; name-search hits are *other* artists —
"BZ, Norwegian rapper", "Bz Bz Ueu", "B.Z.") and **no** Wikidata item. These can't be
added to `sameAs` until they exist — a `sameAs` to the wrong entity *hurts* resolution
(that was the exact bug just fixed). **This is a human-gated step** — it needs an
account on each community-moderated platform; it can't be done autonomously, and faking
it would re-introduce the wrong-entity error. The steps below make it ~10 minutes.

## 1. MusicBrainz (do this first — Wikidata can reference it)

1. Create/log in: <https://musicbrainz.org> (free).
2. **Add Artist** → name `bZ`, type *Person* (or *Group* if you prefer the project
   framing), country *US*, optional disambiguation `Newark hustle-gospel artist`.
3. On the new artist page → **Add relationship → URL** for each of (the canonical
   identity links; all public):
   - Official homepage → `https://bz.rocks`
   - Streaming → the Spotify artist: `https://open.spotify.com/artist/0hDEUhE0QAh51cM1Fe2p3T`
   - Social → the verified socials in `index.html` `sameAs` (instagram/twitter/tiktok/github `heymegabyte`/`HeyMegabyte`).
4. **Add each release.** The real per-album Spotify + Apple URLs are the single source
   of truth in **`src/data.ts` → `DIRECT_ALBUM_LINKS`** (don't retype — copy from there;
   that's what the site itself links). For each album add a Release Group → link its
   Spotify + Apple URL. MusicBrainz then back-fills ISRCs/tracklists from the DSPs over
   the following days.
5. (Optional, raises match confidence) add ISRC codes — pull them from DistroKid
   (each release → *ISRC*). If you add them here, also add `isrcCode` to the track
   `MusicRecording` JSON-LD in `src/track-meta.ts` (only once you have the REAL codes —
   never fabricate one).

## 2. Wikidata (only if notability holds — judgment call)

- Wikidata wants **notability** (independent, reliable coverage). A DistroKid-only
  indie artist may be declined/deleted — decide before investing. If there's press /
  a MusicBrainz entry / charting, it's defensible.
- If proceeding: <https://www.wikidata.org> → **Create a new item** → label `bZ`,
  description `American hustle-gospel musician`, then add statements:
  `instance of (P31)` → human; `occupation (P106)` → musician; `MusicBrainz artist ID
  (P434)` → the MBID from step 1; `Spotify artist ID (P1902)` → `0hDEUhE0QAh51cM1Fe2p3T`;
  `official website (P856)` → `https://bz.rocks`.

## 3. Close the loop on-site (after the entries exist)

- Add the new MusicBrainz artist URL (`https://musicbrainz.org/artist/<MBID>`) and, if
  created, the Wikidata URL (`https://www.wikidata.org/wiki/<QID>`) to the `sameAs`
  arrays in **`index.html`** (homepage MusicGroup) AND **`src/track-meta.ts`**
  (`artistEntity()`), then redeploy. Now the reference is reciprocal.
- Re-verify each new `sameAs` URL resolves (status 200 + it's genuinely bZ) before
  shipping — same grounding gate that caught the wrong Spotify id.

## Re-check for existing entries (so this never duplicates)

```bash
# MusicBrainz: is the Spotify artist now linked to an MB artist?
curl -s -A "bz.rocks-agent/1.0 (blzalewski@gmail.com)" \
  "https://musicbrainz.org/ws/2/url?resource=https://open.spotify.com/artist/0hDEUhE0QAh51cM1Fe2p3T&inc=artist-rels&fmt=json"
# Wikidata: any item for the artist yet?
curl -s "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=bZ%20hustle%20gospel&language=en&format=json"
```
