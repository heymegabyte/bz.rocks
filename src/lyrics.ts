// LRC parsing utilities — parse [mm:ss.xx] timestamps into synced lines + find the
// active line for a given time. The runtime lyrics loader lives in `main.ts`, which
// fetches the Whisper-aligned `/lyrics/<id>.json`; these pure helpers are exercised
// by `lyrics.test.ts` and kept for LRC-format support.

export interface SyncedLine {
  /** Start time in seconds from the audio origin. */
  t: number;
  text: string;
}

export interface LyricsBundle {
  trackId: string;
  lines: SyncedLine[];
  /**
   * `lrc` — timestamps came from /lyrics/<id>.lrc.
   * `static` — fake timestamps spread evenly over `Track.lyrics`; rescale via {@link scaleStaticBundle}.
   * `empty` — no lyrics available for this track.
   */
  source: 'lrc' | 'static' | 'empty';
}


const LRC_RE = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)$/;

/**
 * Parse an LRC document into sorted {@link SyncedLine} entries.
 *
 * Handles multi-timestamp prefixes — `[00:01.00][00:21.00]Same line at two times`
 * becomes two entries pointing at the same text. Sub-second precision is
 * accepted in 1–3 digit form (`.5` = 500 ms, `.50` = 500 ms, `.005` = 5 ms).
 *
 * Pure, deterministic, no I/O — safe to call from anywhere.
 */
export function parseLrc(text: string): SyncedLine[] {
  const out: SyncedLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // A single line may carry multiple timestamps "[00:01.00][00:21.00]text"
    const stamps: number[] = [];
    let rest = line;
    while (true) {
      const m = rest.match(LRC_RE);
      if (!m) break;
      const mm = parseInt(m[1], 10);
      const ss = parseInt(m[2], 10);
      const cs = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
      const t = mm * 60 + ss + cs;
      stamps.push(t);
      rest = m[4];
      // Continue eating leading [..] groups
      if (!/^\[/.test(rest)) break;
    }
    const cleaned = rest.trim();
    if (!cleaned || stamps.length === 0) continue;
    for (const t of stamps) out.push({ t, text: cleaned });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

/**
 * Active line index given current playback position (seconds). Returns -1
 * before the first timestamp. Binary search — O(log n) per tick so calling
 * from a 60 Hz render loop is cheap even on long lyric sheets.
 */
export function activeLineIndex(lines: SyncedLine[], time: number): number {
  if (!lines.length) return -1;
  let lo = 0,
    hi = lines.length - 1,
    ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].t <= time) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/**
 * For static (no-timestamp) bundles, rewrite the fake stamps so they span the
 * actual audio duration. Leaves a 4% lead-in and an 8% tail so the last line
 * doesn't trigger after playback ends. No-op for non-static bundles.
 */
export function scaleStaticBundle(bundle: LyricsBundle, duration: number): SyncedLine[] {
  if (bundle.source !== 'static' || !bundle.lines.length || !Number.isFinite(duration) || duration <= 0)
    return bundle.lines;
  const n = bundle.lines.length;
  const span = duration * 0.92; // leave a tail
  const start = duration * 0.04;
  return bundle.lines.map((l, i) => ({ t: start + (i / Math.max(1, n - 1)) * span, text: l.text }));
}
