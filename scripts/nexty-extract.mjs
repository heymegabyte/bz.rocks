#!/usr/bin/env node
// Extract {slug, title, sunoId, durationSec, createdAt} for every staged nexty
// song by probing its audio tags. Foundation for the data.ts/suno-meta build.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STAGE = path.join(process.env.HOME, 'Desktop', 'suno-assets');

function probe(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'quiet', '-show_format', file], { encoding: 'utf8' });
    const tags = {};
    for (const line of out.split('\n')) {
      const m = line.match(/^TAG:([^=]+)=(.*)$/);
      if (m) tags[m[1].toLowerCase()] = m[2];
      const d = line.match(/^duration=(.+)$/);
      if (d) tags._duration = parseFloat(d[1]);
    }
    return tags;
  } catch {
    return {};
  }
}

const rows = [];
for (const slug of readdirSync(STAGE)) {
  const dir = path.join(STAGE, slug);
  if (!statSync(dir).isDirectory()) continue;
  const files = readdirSync(dir);
  const m4a = files.find(f => f.endsWith('.m4a'));
  const wav = files.find(f => f.endsWith('.wav'));
  const mp3 = files.find(f => f.endsWith('.mp3'));
  if (!wav) continue;
  const tM4a = m4a ? probe(path.join(dir, m4a)) : {};
  const tMp3 = mp3 ? probe(path.join(dir, mp3)) : {};
  const tWav = probe(path.join(dir, wav));
  const comment = tM4a.comment || tMp3.comment || tWav.comment || '';
  const id = (comment.match(/id=([0-9a-f-]{36})/) || [])[1] || '';
  const created = (comment.match(/created=([0-9T:\-.Z]+)/) || [])[1] || '';
  const title = tMp3.title || tWav.title || m4a?.replace(/\.m4a$/, '') || slug;
  rows.push({ slug, title, sunoId: id, durationSec: Math.round(tWav._duration || 0), createdAt: created });
}

rows.sort((a, b) => a.title.localeCompare(b.title));
writeFileSync(path.join(STAGE, 'nexty-meta.json'), JSON.stringify(rows, null, 2));
console.log(`extracted ${rows.length} songs · ${rows.filter(r => r.sunoId).length} with suno id`);
for (const r of rows)
  console.log(`  ${r.sunoId || '????????'}  ${String(r.durationSec).padStart(3)}s  ${r.title}`);
