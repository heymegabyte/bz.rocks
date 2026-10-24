# Gorgeous pass — every component + screen, 100 miles further

Brian directive 2026-10-24: _"Loop through every single component and screen and make it more gorgeous + beautiful."_ This is a **multi-fire** effort — each 15-min loop fire takes ONE surface and makes it measurably more beautiful + more thoroughly programmed (per the Progressively-Gorgeous UI mandate), verified in a real browser (`npm run test:e2e:chrome`) with a screenshot reviewed against the rubric.

## Gorgeous rubric (apply to each surface)

- Cinematic motion: `@starting-style` enter, scroll-driven reveal, View Transitions, brand-locked easing; all `prefers-reduced-motion`-gated.
- Refined type: `clamp()` fluid scales, OKLCH / `color-mix`, `text-wrap: balance`/`pretty`, tracking.
- Depth + texture: layered shadows, glass/grain, accent gradients, hairline dividers, the `--album-accent` per-surface.
- Micro-interactions: hover lift, focus-visible rings, active press, tasteful loading/empty states.
- a11y-as-craft: AA contrast, 24px targets, keyboard nav, aria.
- **Connected + honest** (per `frontend-judgeable-no-orphan-code`): every claim/CTA backed by a real reachable action; no dead UI.

## Surfaces (one per fire — mark ✅ when it clears the rubric + is screenshot-verified)

- [x] Homepage hero / masthead — cinematic staggered entrance + breathing accent-glow
- [x] Album cards — cinematic scroll-reveal entrance (covers/hovers/mandala already rich)
- [x] Track rows — reviewed: already meet the rubric (hover, is-current, animated equalizer bars, play stats); no forced change
- [x] Transport bar — reviewed: already rubric-clean (hover-grow scrubber, wave + buffer, 20+ `is-playing` states, suno BPM/key chip)
- [x] Aeon's Choice / AI playlist rail — fixed the all-"100" scores (SSR-fallback spread)
- [ ] Now-playing panel (cover ring, stats/tags, wisdom, liner, meaning, segue, similar chips, lyricbox)
- [ ] Cmd+K search (literal + AI vibe picks + play-as-set)
- [ ] AI DJ chat drawer
- [ ] Queue / library panel (Queue/AI/Recents/Top/Moods/Albums tabs)
- [ ] Content pages shell (/press, /merch, /about…) + TOC + share
- [x] /stats page — AI "state of the catalog" read (SSR, crawlable) + 47.8s→1.77s perf fix
- [ ] Visualizer / fullscreen lyrics / karaoke overlay
- [ ] Video-cinema overlay
- [ ] Merch cart + checkout + success
- [ ] Newsletter signup (inline + end-of-list)
- [ ] Chrome: PWA install banner, autoplay prompt, toasts, 404 / error states

## Done this pass

- ✅ Content-page: removed the Print button (killed a `javascript:` CSP smell); gave the press-kit request a gorgeous accent-pill CTA (real mailto behind the "press kit" claim). 2026-10-24.
- ✅ Homepage hero: cinematic staggered entrance (eyebrow → title → vibe fade-up) + a slow breathing accent-glow on the "PRESS PLAY" title so the idle hero feels alive; all `prefers-reduced-motion`-gated, respecting the pure-white/no-scrim directive. 2026-10-24.
- ✅ Album cards: pure-CSS scroll-reveal entrance (`animation-timeline: view()`) — each card fades up as it enters the rail, cohesive with the hero; no JS, no FOUC, `@supports` + reduced-motion gated (Firefox/older show static). Covers/title/platform hovers + featured mandala were already rich, so motion was the gap. 2026-10-24.
- ✅ /stats page: (1) a grounded AI "state of the catalog" read — 1-2 sentences over the live totals + most-played list, generated async (ctx.waitUntil, never blocks) + KV-cached 1h, SSR so it's CRAWLABLE; (2) PERF — the cold render read 336 KV counters SERIALLY (47.8s); batched-parallel now renders in 1.77s. Transport bar reviewed = clean. 2026-10-24.
- ✅ PERF sweep (last fire's Rec): `/api/stats` had the SAME serial per-track KV loop (polled every 30s by the client + hit by the Aeon SSR) — 9.02s cold. Batched-parallel → 0.88s (~10×). Speeds up Aeon's Choice load + the client re-sync poll. 2026-10-24.
- ✅ Aeon's Choice rail: fixed the all-"100" score bug — the SSR-fallback (fresh load, before client stats) assigned `1 - i*0.001` (0.999/0.998/… all rounding to 100); now spreads `1 - i*0.05` so picks read 100/95/90/85/80 (ranked gradient) until real `/api/stats` scores load. Also fixed a STALE play-order test (Reckless Grace album track order had drifted: count-what-i-got → now reckless-grace → nobody-beneath-us → luminous-love). Track rows reviewed — already rubric-clean. 2026-10-24.

## Method per fire

1. Pick the top unchecked surface. 2. Screenshot current state (`npm run test:e2e:chrome`, flip screenshot on). 3. Apply the rubric. 4. Re-screenshot + review. 5. E2E green at 390/1280. 6. Deploy + check ✅ here.
