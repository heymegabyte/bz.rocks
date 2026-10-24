// Pure formatting helpers — no DOM, no shared state, no side effects.
// Extracted from main.ts (which had its own copies) + de-duplicated against
// embed.ts and pip.ts, which each carried a byte-identical `fmtTime`. One home,
// imported everywhere, so the next tweak lands in a single place.

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

/** Seconds → `m:ss` clock string. Negative / non-finite → `0:00`. */
export function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Alias kept for the now-playing HUD callsite that used `fmtClock`. */
export const fmtClock = fmtTime;

/** Frequency → human label: `440 Hz`, `1.20 kHz`, or `— Hz` when invalid. */
export function fmtHz(hz: number): string {
  if (!Number.isFinite(hz) || hz <= 0) return '— Hz';
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return `${Math.round(hz)} Hz`;
}

/** Frequency → nearest equal-tempered note name + octave (A4 = 440 Hz). */
export function hzToNote(hz: number): string {
  if (!Number.isFinite(hz) || hz <= 20) return '—';
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}

/**
 * Authoritative musical key → compact HUD shorthand: `"C# minor"` → `"C#m"`,
 * `"a major"` → `"A"`. Capitalizes the note, normalizes the accidental to `#`/`b`,
 * and appends `m` for minor (major stays bare — standard chord/key notation). A
 * musical key is constant per track and carries NO octave digit, which is what
 * distinguishes it from a live peak-frequency note like `"C#4"`. Missing/empty → `—`.
 */
export function fmtKeyCompact(key: string | null | undefined): string {
  if (!key) return '—';
  const m = key.trim().match(/^([A-Ga-g])\s*([#b♯♭]?)\s*(major|minor)$/i);
  if (!m) return key.trim();
  const acc = m[2] === 'b' || m[2] === '♭' ? 'b' : m[2] ? '#' : '';
  const note = m[1].toUpperCase() + acc;
  return m[3].toLowerCase() === 'minor' ? `${note}m` : note;
}
