# AI features backlog — bz.rocks

Doctrine: **inference is cheap + abundant → take every surface 100 miles further.** Prefer generative/semantic over static; backfill thin surfaces with grounded AI; precompute + KV-cache; never fake a model in the UI. (Global rule: `ai-abundance-maximalism`.) The 15-min audit loop picks the top unbuilt item each fire.

All features reuse the proven `env.AI` (Workers AI Llama) + KV-cache + grounded-prompt + fail-soft pattern from `/api/liner` and `/api/meaning`.

## Shipped

- ✅ **AI lyric deep-dive** — `/api/meaning?track=<id>` → 3 grounded interpretive beats under the liner note (`#npPanelMeaning`). 2026-10-24.

## Ranked next (impact ÷ effort)

1. **AI Vibe/Mood Matcher** (S) — free-text mood → rank the real catalog, return track-cards with a one-line rationale each. New `/api/vibe?q=` grounded on `src/data.ts`; render via existing `ai-widgets` track-card. Natural-language discovery beats genre filters.
2. **Generative playlist builder** (M) — "90-min sunset-drive set" → ordered picks + per-track rationale. `/api/playlist/generate`; reuse track-card + quick-reply widgets; KV-cache by prompt hash.
3. **Per-album AI "drop" essay** (M) — weekly auto-written album-of-the-week + top-3 track picks, cached 7d, surfaced on homepage hero. Zero manual curation.
4. **AI-narrated per-track micro-podcast** (M) — 60-90s script per track (reuse `/api/meaning` grounding) → TTS to R2, play in NP panel. Gated on R2 (currently disabled — see memory `r2-disabled-outage`).
5. **Semantic search over lyrics + catalog** (M) — NL query ("songs about leaving the block") → hybrid retrieval + rerank over lyrics; per `ai-first-search` doctrine. New `/api/search`.
6. **AI "what to play next" segue** (S) — when a track ends, a one-line grounded "why this next" above the autoplay pick. Reuse chat model, cache per (from→to) pair.

## Guardrails (every item)

- Ground to real catalog/lyrics only — no invented people/facts (Christian-gangster ethic, zero drug refs).
- Zod/typed boundary + fail-soft (empty result never blocks UI).
- KV-cache the generative path; rate-limit per IP like `/api/liner`.
- TDD: API-contract spec + NP-panel/widget spec at 6bp against PROD before done.
