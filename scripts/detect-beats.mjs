#!/usr/bin/env node
// scripts/detect-beats.mjs
// Detect beat times (seconds) from an audio file via aubio (aubiotrack): ffmpeg→wav→aubiotrack.
// Fallback to a uniform BPM grid if aubio is unavailable. Powers beat-synced cutting in veo-film.mjs.
// Usage: node scripts/detect-beats.mjs <audio>  → prints JSON { beats, duration, src, count }
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileP = promisify(execFile);

export async function detectBeats(audio) {
  const { stdout: durOut } = await execFileP('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    audio
  ]);
  const duration = parseFloat(durOut.trim());
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'beats-'));
  const wav = path.join(tmp, 'a.wav');
  try {
    await execFileP('ffmpeg', ['-nostdin', '-y', '-i', audio, '-ac', '1', '-ar', '44100', wav], {
      maxBuffer: 1 << 27
    });
    const { stdout } = await execFileP('aubiotrack', [wav], { maxBuffer: 1 << 27 });
    const beats = stdout
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(n => Number.isFinite(n) && n >= 0);
    await rm(tmp, { recursive: true, force: true });
    if (beats.length > 8) return { beats, duration, src: 'aubio' };
  } catch {
    /* fall through to grid */
  }
  await rm(tmp, { recursive: true, force: true }).catch(() => {});
  const beats = [];
  for (let t = 0; t < duration; t += 0.5) beats.push(+t.toFixed(3)); // ~120bpm fallback grid
  return { beats, duration, src: 'grid' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await detectBeats(process.argv[2]);
  console.log(JSON.stringify({ ...r, count: r.beats.length }));
}
