# Suno asset-download loop — recipe & state

System for downloading **all assets of every song** in the Suno "nexty" playlist (43 songs) via computer-use, then cataloguing + integrating. Runs off the 15-min cron (`bafa8657`). Source of the process: `~/Desktop/suno-asset-download-instructions.mov`.

## Assets per song (land in `~/Downloads`, named by title)

`<Title>.m4a` · `<Title>.mp3` · `<Title>.wav` · `<Title>.mp4` (video asset) · `<Title> Stems.zip` (stems + MIDI).

## The download recipe (per song)

1. Hover the song row → its `⋯` appears (**takes TWO clicks** on the `⋯`: first arms the row, second opens the menu).
2. Menu → **Download** (5th item; ~54px below the `⋯`). ⚠️ "Move to Trash" / "Remove from Playlist" are in this same menu — **screenshot-verify before every click**.
3. Dialog is **multi-select** (not radio): tick **M4A, MP3, WAV, MP4 video asset** → one **Unlock & Download** pulls all four.
4. **Stems & MIDI** is separate: click **Manage** → **Extract** (Auto split) → wait (async, minutes) → **Download ready stems** → `<Title> Stems.zip`.
5. Close dialog: **Esc**.
6. Run `node scripts/suno-asset-sync.mjs` → stages `~/Downloads/<Title>.*` into `~/Desktop/suno-assets/<slug>/` + updates `catalog.json`.

## 💳 Cost — METERED, read before mass-running

- Plan **Premier · 64 downloads · refreshes 11/3/26**. **Each new song's first "Unlock & Download" consumes 1 credit** (then that song is unlocked — all its formats re-download free). Multi-select = **1 credit gets all 4 formats**.
- **43 songs ≈ 43 of 64 credits** (fits, leaves ~20). Stems extraction may cost extra credits + real time (minutes/song). Already spent: Stars (pre-existing) + **Facts Before Fear (1 credit, this run)**.

## Coordinate mapping (this display)

Built-in Retina **3456×2234** (2×). `screencapture` outputs native px; the agent views it at 2000-wide. **cliclick point = observed(2000-wide) × 0.864** (= ×1.728 native ÷2). Verified accurate. Always `screencapture -xC` (cursor shown) and **verify the cursor/target before clicking** — never blind-click.

## State / catalog

- `scripts/suno-asset-sync.mjs` — scans `~/Downloads`, anchors on `<Title>.wav` (ignores unrelated media like `ghost-evidence-*.mp4`), stages to `~/Desktop/suno-assets/<slug>/`, writes `catalog.json` (status: complete = wav+mp4+stems).
- Done so far: **Stars Don't Need Permission** (complete, 5 assets) · **Facts Before Fear** (partial — m4a/mp3/wav/mp4, stems pending).

## ⚠️ Integration — OPEN QUESTION

These 43 "nexty" songs are **NEW** (not in `src/data.ts`): e.g. _Stars Don't Need Permission, Facts Before Fear, The 7/11 Prophecy, Fourteen Fins, Find Me on Algenib, A Hundred Books One Life_. Integrating needs direction: **new album? replacements? which `album` id? lyrics/metadata source?** Audio → `public/audio/<id>.mp3` (convert from wav/m4a), video → R2 `/media/<id>.mp4` + `Track.video`, metadata → `src/suno-meta.ts` + `src/data.ts`. **Do not guess the album assignment — confirm first.**

## Loop job (each 15-min fire)

Pick next un-complete song from the playlist → run the recipe (verify every click) → sync → repeat. Stop when `catalog.json` shows all 43 complete. Surface credit burn + the integration question rather than guessing.
