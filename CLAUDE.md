# CLAUDE.md — agent guide for `bz.rocks`

Brief for AI agents working in this repository. Read this first.

## What this is

bZ's music site at <https://bz.rocks>. Vanilla TypeScript + Vite bundle served by a Cloudflare Worker (`worker/index.ts`). The Worker handles SEO rewriting, the `/api/*` surface, and edge caching for `/audio/*` + `/lyrics/*`.

The app is a single-page experience. The audio element is created once and persists across all internal navigation — never tear it down on a route change.

## Stack

- **Frontend:** vanilla TypeScript + Vite v6, no UI framework
- **Backend:** Cloudflare Worker + Wrangler v4
- **State:** KV namespace `COUNTERS` (plays, shares, rate limits, push subs, listmonk cache)
- **Tests:** Playwright v1.59 E2E, 6 breakpoints, runs against `PROD_URL`
- **Deploy:** `npx wrangler deploy` then purge the CF zone

## Where to make changes

| Task                             | File                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| New track or album               | `src/data.ts`                                                                            |
| Per-route SEO / OG tags          | `src/track-meta.ts` (consumed by `worker/index.ts`)                                      |
| Transport UI / app shell         | `src/main.ts` (large; search first)                                                      |
| AI DJ drawer                     | `src/ai-chat.ts`                                                                         |
| AI chat widget kinds + renderer  | `src/ai-widgets.ts` (see [`docs/ai-chat-widgets.md`](./docs/ai-chat-widgets.md))         |
| `/shortcommands` palette builder | `src/ai-shortcommands.ts` (see [`docs/ai-chat-commands.md`](./docs/ai-chat-commands.md)) |
| Visualizer                       | `src/visualizer.ts`                                                                      |
| Suno WAV/MIDI/VIDEO download      | `scripts/fetch-suno-media.mjs` (`npm run media:fetch` — needs fresh `SUNO_COOKIE`)       |
| Cinematic music video + film player | `Track.video` in `src/data.ts` → `/media/pub/<id>.mp4` (STATIC asset — R2 is disabled account-wide, so films ship under `public/media/pub/` + are served via the `env.ASSETS` fallback in the worker `/media` handler; keep each **≤25 MiB** per the Workers-Assets cap). `video-cinema` overlay + `openVideoCinema` in `src/main.ts`; VideoObject JSON-LD on `/watch/<id>`. Gen: author `scripts/films/<id>/manifest.json` (CINEMA MIND — validate to 0 errors via `~/.claude/skills/video-create/engine` `demo/validate-file.ts`) → preview `MINIMAX=1 FILM_ID=<id> SHOTS=… node scripts/veo-film.mjs`, then full `… FULL=1 BEATCUT=1`. Reference film: `scripts/films/border-mercy/`. The `/watch/<id>` page (`renderWatchPage` in `worker/index.ts`) SSR-renders title + wisdom + a client-fetched AI liner ("story behind the film", `/api/liner`) + a **"More films" row** linking every OTHER `Track.video` (interconnectedness, auto-grows as films ship; guarded by `tests/watch-morefilms.spec.ts`). NOTE 2026-10-25: a prior render briefly opened with a stray "St. John's Halo" title card; RESOLVED — the re-cut master + deployed `border-mercy.mp4` both open correctly on the pit (verified first-frame). |
| "Listen on" row (icon chips)     | `renderListenOn` in `src/main.ts` shows ALL 5 platform icons per album (Spotify/Apple/YouTube Music/Amazon/Tidal). Uses the VERIFIED direct URL from `DIRECT_ALBUM_LINKS` in `src/data.ts` (resolved by `scripts/resolve-album-links.ts` — accent chip) else that platform's album search. Favorites/hearts feature was REMOVED 2026-09-20 — don't re-add |
| AI liner notes ("story behind")  | `/api/liner?track=<id>` in `worker/index.ts` (Workers AI Llama, KV-cached, GROUNDED — forbid invented people/facts) → np-panel `#npPanelLiner` in `src/main.ts` |
| AI lyric deep-dive ("what it's really saying") | `/api/meaning?track=<id>` in `worker/index.ts` (Workers AI Llama, KV-cached 30d, GROUNDED — 3 interpretive beats as `points[]`, no invented facts). Surfaced on TWO surfaces sharing one fetch/memo: the np-panel (`#npPanelMeaning` + `loadMeaning`) AND the fullscreen-lyrics view (`#lyricsFsMeaning` collapsible + `loadFsMeaning`, opened via `openLyricsFs`). Both reuse `fetchMeaningPoints`/`renderMeaningList` + the shared `meaningCache` (fetched once). The fs-lyrics deep-dive is a `<details>` collapsed by default so it never distracts the karaoke read. Guarded by `tests/ai-meaning.spec.ts`. NOTE: the nav LYRICS toggle opens the KARAOKE overlay; the FULLSCREEN `#lyricsFs` opens via the np-panel/more-menu `fs-lyrics` action |
| AI "how this song lives its wisdom" | `/api/wisdom?track=<id>` in `worker/index.ts` (70B, KV-cached 30d `wisdom-how:<id>#v1`, GROUNDED) → np-panel `#npPanelWisdomHow` + `loadWisdomHow` in `src/main.ts` (mirrors the liner loader; rendered directly UNDER the wisdom quote with an accent rail so it reads as flowing from it). ONE vivid line tying the track's `wisdom` (a Robert Greene law or scripture) to a CONCRETE action/image IN the song — never restating the law. Lyric-grounded (that's what makes it concrete despite the wisdom field clustering: 168 tracks → only 17 laws group ≥2). A `GENERIC` backstop regex forbids interchangeable faith-platitudes ("through faith and action", "embodies resilience", "a testament to"). Guarded by `tests/wisdom-how.spec.ts`. Bump `#v<n>` when changing the prompt/backstop |
| AI share caption (distribution) | `/api/sharecopy?track=<id>` / `?album=<id>` in `worker/index.ts` (70B, KV-cached 30d, GROUNDED from vibe+wisdom+a lyric line) → `#shareCaption` textarea in the share dialog (`openShare` in `src/main.ts`). Must be CONCRETE + song-specific: the prompt forbids the generic "(hard) holy/gospel vibes/beats" formula with BAD/GOOD examples, and a deterministic `GENERIC_CAP` backstop backfills from the song's own lyric (or album tagline) when the model still goes generic. Bump the `#v<n>` cache key when changing the prompt/backstop. Guarded by `tests/sharecopy-quality.spec.ts` |
| AI segue ("up next" bridge) | `/api/segue?from=<id>&to=<id>` in `worker/index.ts` (70B, KV-cached `#v<n>`) → AI Radio up-next + np-panel segue eyebrow. A vivid pair-specific fragment. WATCH few-shot example PARROTING: the model copies a GOOD example verbatim ungrounded — the prompt now says examples are "STYLE ONLY, never reuse the opener" + a backstop rejects the proven copy-tells (`/^darkness shifts to/`, `/neon skies/`) → fail-soft null. Also bans the "both tracks/the two tracks" filler family. Guarded by `tests/segue-quality.spec.ts`. When editing few-shot examples in ANY AI prompt, re-read real output across many inputs — one sample hides a parroted formula |
| AI album essay ("about this drop") | `/api/album-essay?album=<id>` in `worker/index.ts` (70B, KV-cached `#v<n>`) → album-card essay. Must LEAD with the album's specific tracks/imagery, never generic essay scaffolding. The prompt BANS "weaves/weaving a narrative of …", "is a testament to …", "X sets the tone" openers + demands named tracks; a `BANNED_FRAME` regenerate-ONCE backstop (`genEssay` helper, temp 0.85) enforces the frames (the "sets the tone" opener is soft-nudged only). Guarded by `tests/album-essay-quality.spec.ts`. Fixing one formula often surfaces a milder new crutch ("sets the tone") in the SAME verify pass — re-read output after each prompt change |
| NL vibe search ("search a title, lyric, or vibe") | `/api/vibe?q=<query>` in `worker/index.ts` (70B, KV-cached `vibe:<norm>#v<n>`, GROUNDED over the FULL catalog) → cmdk `.cmdk__group--ai` picks (each `id | why`), rendered `.cmdk__why`. Each `why` must be a VIVID 5-10 word CONCRETE phrase naming an image/action/place IN the track — NEVER a terse query-echo (restating the query is a non-reason). Three backstops in the parse loop: `circular` regex (the "matches the X mood" family), `genreOnly` regex (gospel-trap is never a reason — every track is), and **token-overlap echo detection** (`isEcho`: if the `why`'s stopword-stripped content words are ALL already in the query → backfill from the track's own `vibe`, keeping the real match rather than dropping it). Bump `#v<n>` when changing the prompt/backstops. Guarded by `tests/ai-vibe.spec.ts` (asserts no leak/circular/id-as-title/query-echo) |
| Related tracks ("more like this") | np-panel `#npPanelRelated` in `refreshNpPanel` (`src/main.ts`). GROUNDED `/api/similar` picks (70B, each with its `why`) — the SAME engine behind the Queue AI tab + AI Radio; shares `queueSimilarCache` (zero duplicate fetches). Paints an instant local tag-Jaccard set first, then upgrades to the grounded picks when they land; **fail-soft** keeps the Jaccard on any miss. Race-guarded (`npPanelOpen && currentTrackId === relTrack.id`). `why` styled `.np-panel__related-why` |
| Hero vibe-tag EXPLORE | hero chips in `renderNowPlaying` (`#heroTags`, `src/main.ts`). `topTagsFor` ranks the 4 display namespaces (mood/genre/theme/place) by DISTINCTIVENESS (TF-IDF: `tagExplorable`-first, then rarest `tagCount`) so chips CHARACTERIZE the track — not the old first-2-moods which buried distinctive tags (left 66/168 tracks with 0 explorable chip). A SELECTIVE chip (`tagExplorable` — `2 ≤ tagCount ≤ 45%` of catalog) is a `<button data-explore-tag>` that opens the search filtered to every track sharing it (`tracksByTag` from `src/tags.ts` → `openSearch({query,tracks})`). `exploreTag` EXCLUDES the current track and RANKS the co-tagged set by relevance to it (shared AI-tag count + same-album bonus, stable sort) so a big tag's capped "top 24" surfaces the most-related tag-mates, not catalog order (12/25 explorable tags exceed the 24-row cap); fail-soft to catalog order when no current track. Near-universal tags (e.g. `sacred` 92%) are bumped out or trail as inert `<span>`s; energy/tempo fill only if <5 chips. `tagCount` memoizes the freq map once. Delegated click on `#heroTags`; button styled `.viz__hero-tag--explore` (needs `pointer-events:auto` — `.viz__hero` is `pointer-events:none`) with a `↗` affordance. **The now-playing panel tag strip (`#npPanelTags` in `refreshNpPanel`) uses the SAME `topTagsFor(7)` + `tagExplorable` + `exploreTag` — distinctive + explorable, styled `.np-panel__tag--explore`; its click handler calls `closeNpPanel()` FIRST (the panel is a z-50 dialog; `#cmdk` is z-200) then `exploreTag`.** Keep the two chip surfaces in sync |
| Play counts + Aeon's Choice      | GLOBAL only + identical on every browser. `aiPicks` ranks by global `plays×0.73+shares×0.27` (no per-device signals). NO localStorage `statsCache` seed (that per-browser history was the real divergence — removed); first paint uses `window.__AEON_SSR` (global). `/api/stats` = 15s edge cache + a 30s client re-sync poll so open tabs converge live |
| PWA install banner               | `maybeShowInstallAfterListen` in `src/main.ts` — gated on `songsListenedCount() >= INSTALL_MIN_SONGS` (10 distinct songs). Don't show it earlier |
| Public stats page `/stats`       | `renderStatsPage` in `worker/index.ts` (live KV counts + MusicGroup JSON-LD, 300s edge cache); footer link + `gen-sitemap.mjs` + `validate-links.ts` SPECIAL_ROUTES |
| Worker route or API              | `worker/index.ts`                                                                        |
| Styles                           | `src/style.css` (one file, cascade-layered)                                              |

## Hard rules

1. **Audio persistence.** `<audio data-engine="bz">` is created in `src/audio.ts` and owned by the top-level document. Any change that tears it down on navigation is a regression.
2. **SPA-only routing.** Routes like `/canopy/<track>`, `/halo/...`, `/appeal`, `/ashton` are served by `env.ASSETS.fetch(new URL('/', ...))` so the same shell boots. Don't add a real HTML file at those paths.
3. **Per-route metadata is server-rendered.** Add metadata in `src/track-meta.ts` so `MetaRewriter` in `worker/index.ts` rewrites `<head>` at the edge. Never inject `<title>`/`<meta>` from client-side JS for crawlable content.
4. **TypeScript strict is on.** `tsc -b` runs in `npm run build`. Don't disable strict; add types instead.
5. **Tests start at the homepage.** Real-user flows — click through to the feature; don't `page.goto` an internal route unless the test specifically asserts per-route SEO.

## Workflow

```bash
npm run dev           # local dev (vite, http://localhost:5173)
npm run build         # tsc -b && vite build (regenerates OG cards via prebuild)
npm run test:e2e      # Playwright against PROD_URL
npx wrangler deploy   # ship the worker + assets
```

After deploy: purge the CF zone (`/client/v4/zones/<zone>/purge_cache`) so the rewritten HTML hits clients immediately.

## Secrets

Worker reads secrets from `wrangler secret put`:

- `/api/ai/chat` + `/api/liner` (AI liner notes) run on the **`env.AI` Workers AI binding** (Llama 3.x FP8) — no Anthropic key needed
- `LISTMONK_API_TOKEN` — required for `/api/subscribe`
- `VAPID_*` + `PUSH_ADMIN_TOKEN` — required for `/api/push/*`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` — required for `/api/merch/*`

Local dev uses `.dev.vars` (gitignored).

## Conventions specific to this repo

- **Payments:** Stripe for ALL online payments — always. `/api/merch/checkout` is Stripe Checkout and stays that way. Square is only ever added when a real in-person/POS leg exists (this storefront has none). Do not migrate online flows to Square.
- **Lyrics timing:** if karaoke is "off", the stored lyrics are usually the wrong Suno take (or polluted with prompt metadata), NOT a timing bug — the aligner's `stats.matchRate` will be low. Rebuild from the accurate transcript with `npm run lyrics:rebuild -- <id>` (wraps `scripts/rebuild-lyrics-from-cache.mjs`), then it re-syncs `src/data.ts`. `npm run lyrics:validate` (also in `prebuild`) hard-fails on wrong-take (matchRate <60%) + collapsed lines; allowlist a track in that script only when Whisper genuinely can't hear it (e.g. `cbo-pen` number-rap).
- **Lyrics:** Christian-gangster ethic. Zero drug references. See `~/.claude/projects/-Users-apple-emdash-projects-music-megabyte-space/memory/feedback_lyrics_christian_gangster.md`.
- **Cast:** default receiver (`CC1AD845`) until the custom receiver is device-bound. Custom App ID `228565CB` lives in `src/cast-protocol.ts`.
- **Karaoke overlay:** word highlighting mirrors the fullscreen lyrics pattern in `src/main.ts` (parallel arrays `karaokeOverlayWords` + `karaokeOverlayWordSpans` + `karaokeOverlayWordIdx`, driven by the existing `startKaraoke` tick loop).
- **AI chat widgets:** assistant messages can carry typed `AiChatWidget[]` payloads — track-card, album-card, command-palette, citation, alert, code-snippet, etc. The renderer in `src/ai-widgets.ts` is a pure HTML-string builder; every URL goes through `safeUrl()` and every string through `escapeHtml()`. Run `/shortcommands` (or `/sc`) in the chat panel to see every slash command as a grouped, clickable palette. Full reference: [`docs/ai-chat.md`](./docs/ai-chat.md), [`docs/ai-chat-widgets.md`](./docs/ai-chat-widgets.md), [`docs/ai-chat-commands.md`](./docs/ai-chat-commands.md).
- **AI chat grounded actionability backstop:** the fast chat model usually recommends tracks/albums in plain prose with no ` ```aiwidgets ` block. `detectTrackMentions()` + `detectAlbumMentions()` (both exported from `src/ai-chat.ts`) scan a finished reply for VERBATIM catalog titles/names and auto-attach cards — so every prose pick is one tap from the persistent player. Pure client-side match against the real catalog → zero AI cost, grounded (only real names match, never a hallucinated card), fail-soft. Runs only when the model emitted no explicit widgets, and **album-first** (`detectAlbumMentions` → album-card + the album's full tracklist, so `renderWidgets` auto-adds "▶ Play all as a set" → plays it in-context; its tracklist already covers any track also named) → else `detectTrackMentions` (per-track `track-card`s). False-positive guards: track single-word titles need ≥8 chars; album names strip a leading "the" then need ≥2 words OR ≥9 chars (so "The Appeal"/"The Pause" can't false-fire on ordinary prose); both match longest-first + boundary-delimited + consume matched text. Album cap 1.
- **AI chat grounding + personalization (`/api/ai/chat` + `trackContext` in `src/ai-chat.ts`):** the CLIENT builds `fullSystem` = persona + `trackContext()` (now-playing/album + **recently-played** from `localStorage['bz:recents']` + **all-time taste** from `bz:listenStats`, most-played first) and sends it as `body.system`. The WORKER then ALWAYS appends the real catalog + "NEVER invent" GROUNDING to that system (`baseSystem + GROUNDING + chatCatalog`) — it MUST be appended on the live path, not just the no-system `else` fallback (the client always sends a system, so a fallback-only catalog is dead code → the 8B hallucinated a fake "Spiritual Warfare"). The DJ thus recommends to the listener's REAL taste AND only REAL tracks (declines fakes). Guarded by `tests/chat-taste-context.spec.ts` (deterministic: seeds history → asserts the request's system carries both personalization lines). When probing the DJ, use a FAKE track name to confirm grounding is LIVE, not just present in code.

## Don't

- Don't add a UI framework (React/Vue/Angular). The project is intentionally vanilla.
- Don't split `src/style.css` into many files; the cascade-layer order is load-bearing.
- Don't add a database or auth provider. The site is stateless beyond KV counters.
- Don't introduce ESLint with autofix in the same PR as feature work — the existing source has not been linted; do it once, separately.
