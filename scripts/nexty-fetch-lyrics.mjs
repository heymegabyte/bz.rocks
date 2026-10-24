#!/usr/bin/env node
// scripts/nexty-fetch-lyrics.mjs
// ---------------------------------------------------------------------------
// Fetch full song data for every staged "nexty" song from Suno's public clip
// API (no auth, no spend): https://studio-api.prod.suno.com/api/clip/<id>.
// Pulls lyrics (metadata.prompt), style (metadata.tags), bpm (parsed from
// tags), duration, model, created-at, Suno cover art url, display tags.
// Reads  ~/Desktop/suno-assets/nexty-meta.json  (slug,title,sunoId,...)
// Writes ~/Desktop/suno-assets/nexty-lyrics.json (the integration dataset).
// ---------------------------------------------------------------------------
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STAGE = path.join(process.env.HOME, 'Desktop', 'suno-assets');
const META = path.join(STAGE, 'nexty-meta.json');
const OUT = path.join(STAGE, 'nexty-lyrics.json');

const roster = JSON.parse(readFileSync(META, 'utf8'));

function fetchClip(id) {
  // curl is more reliable than node fetch for this host's TLS/UA quirks.
  const raw = execFileSync(
    'curl',
    [
      '-s',
      '--max-time',
      '30',
      '-H',
      'User-Agent: Mozilla/5.0',
      `https://studio-api.prod.suno.com/api/clip/${id}`
    ],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
  return JSON.parse(raw);
}

// Lyrics come as metadata.prompt: the first line repeats the title, then blank,
// then [section] headers + lines. Keep section headers (useful for karaoke/UX),
// strip the leading title echo + any trailing whitespace noise.
function cleanLyrics(prompt, title) {
  if (!prompt) return '';
  let lines = prompt.replace(/\r/g, '').split('\n');
  // drop a leading line that just echoes the title (+ following blank)
  while (
    lines.length &&
    (lines[0].trim() === '' || lines[0].trim().toLowerCase() === title.trim().toLowerCase())
  ) {
    lines.shift();
  }
  return lines.join('\n').trim();
}

// Suno packs bpm + key into the free-text tags string. Pull them out.
function parseBpm(tags) {
  const m = (tags || '').match(/(\d{2,3})\s*BPM/i);
  return m ? parseInt(m[1], 10) : null;
}
function parseKey(tags) {
  const m = (tags || '').match(/\b([A-G][#b]?\s*(?:minor|major|min|maj))\b/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

const out = [];
let ok = 0;
for (const r of roster) {
  if (!r.sunoId) {
    out.push({ ...r, error: 'no-suno-id' });
    continue;
  }
  try {
    const c = fetchClip(r.sunoId);
    const tags = c.metadata?.tags || '';
    out.push({
      slug: r.slug,
      title: c.title || r.title,
      sunoId: r.sunoId,
      durationSec: Math.round(c.metadata?.duration || r.durationSec || 0),
      duration: c.metadata?.duration ?? r.durationSec ?? null,
      createdAt: c.created_at || r.createdAt || '',
      model: c.model_name || c.major_model_version || '',
      modelMajor: c.major_model_version || null,
      modelName: c.model_name || null,
      style: tags,
      displayTags: c.display_tags || '',
      bpm: parseBpm(tags),
      musicalKey: parseKey(tags),
      hasHook: Boolean(c.has_hook),
      isRemix: Boolean(c.metadata?.is_remix),
      isInstrumental: Boolean(c.metadata?.make_instrumental) || !(c.metadata?.prompt || '').trim(),
      explicit: Boolean(c.explicit),
      playCount: c.play_count ?? 0,
      upvotes: c.upvote_count ?? 0,
      audioUrl: c.audio_url || null,
      sunoImage: c.image_large_url || c.image_url || '',
      videoUrl: c.video_url || null,
      handle: c.handle || c.display_name || null,
      sunoUrl: `https://suno.com/song/${r.sunoId}`,
      lyrics: cleanLyrics(c.metadata?.prompt, c.title || r.title)
    });
    ok++;
    process.stdout.write(
      `  ✓ ${r.title}  (${parseBpm(tags) || '?'} BPM · ${(c.metadata?.prompt || '').split('\n').length} lines)\n`
    );
  } catch (e) {
    out.push({ ...r, error: e.message });
    process.stdout.write(`  ✗ ${r.title}  — ${e.message}\n`);
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nfetched ${ok}/${roster.length} · wrote ${OUT}`);
