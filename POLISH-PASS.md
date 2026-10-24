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
- [ ] Album cards (cover mandala, head-meta, listen-on row, "about this drop" essay)
- [ ] Track rows (trackrow, play state, stats)
- [ ] Transport bar (controls, progress, now-playing mini)
- [ ] Aeon's Choice / AI playlist rail
- [ ] Now-playing panel (cover ring, stats/tags, wisdom, liner, meaning, segue, similar chips, lyricbox)
- [ ] Cmd+K search (literal + AI vibe picks + play-as-set)
- [ ] AI DJ chat drawer
- [ ] Queue / library panel (Queue/AI/Recents/Top/Moods/Albums tabs)
- [ ] Content pages shell (/press, /merch, /about…) + TOC + share
- [ ] /stats page
- [ ] Visualizer / fullscreen lyrics / karaoke overlay
- [ ] Video-cinema overlay
- [ ] Merch cart + checkout + success
- [ ] Newsletter signup (inline + end-of-list)
- [ ] Chrome: PWA install banner, autoplay prompt, toasts, 404 / error states

## Done this pass

- ✅ Content-page: removed the Print button (killed a `javascript:` CSP smell); gave the press-kit request a gorgeous accent-pill CTA (real mailto behind the "press kit" claim). 2026-10-24.
- ✅ Homepage hero: cinematic staggered entrance (eyebrow → title → vibe fade-up) + a slow breathing accent-glow on the "PRESS PLAY" title so the idle hero feels alive; all `prefers-reduced-motion`-gated, respecting the pure-white/no-scrim directive. 2026-10-24.

## Found during this pass (surface later)

- Aeon's Choice rail shows EVERY track at exactly "100" plays — looks capped/placeholder, not real global counts. Investigate when polishing the Aeon rail surface.

## Method per fire

1. Pick the top unchecked surface. 2. Screenshot current state (`npm run test:e2e:chrome`, flip screenshot on). 3. Apply the rubric. 4. Re-screenshot + review. 5. E2E green at 390/1280. 6. Deploy + check ✅ here.
