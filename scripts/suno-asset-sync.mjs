#!/usr/bin/env node
// scripts/suno-asset-sync.mjs
// ---------------------------------------------------------------------------
// The backbone of the Suno asset-download LOOP (see suno-asset-download-recipe.md).
// Each Suno song exports three assets, named by TITLE, into ~/Downloads:
//     "<Title>.wav"  "<Title>.mp4"  "<Title> Stems.zip"
// This script DOESN'T click anything (that's the computer-use half) — it is the
// safe state engine the loop runs between downloads:
//   1. scan ~/Downloads, group by song title, detect which of {wav,mp4,stems} exist
//   2. move completed/partial sets into staging ~/Desktop/suno-assets/<slug>/
//   3. write a catalog at ~/Desktop/suno-assets/catalog.json (status per song)
//   4. print a summary: done / partial / (and, given a playlist roster, what's missing)
//
// Usage:  node scripts/suno-asset-sync.mjs            # scan + stage + catalog
//         node scripts/suno-asset-sync.mjs --report   # print catalog only
// ---------------------------------------------------------------------------
import { readdir, mkdir, rename, writeFile, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME;
const DL = path.join(HOME, 'Downloads');
const STAGE = path.join(HOME, 'Desktop', 'suno-assets');
const CATALOG = path.join(STAGE, 'catalog.json');
const REPORT_ONLY = process.argv.includes('--report');

const slug = t =>
  t
    .toLowerCase()
    .replace(/['''".,!?():]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Classify a Downloads filename as a Suno song asset. Returns {title, kind} or null.
function classify(name) {
  if (name.endsWith(' Stems.zip')) return { title: name.slice(0, -' Stems.zip'.length), kind: 'stems' };
  if (name.endsWith('.wav')) return { title: name.slice(0, -4), kind: 'wav' };
  if (name.endsWith('.mp4')) return { title: name.slice(0, -4), kind: 'mp4' };
  if (name.endsWith('.mp3')) return { title: name.slice(0, -4), kind: 'mp3' };
  if (name.endsWith('.m4a')) return { title: name.slice(0, -4), kind: 'm4a' };
  return null;
}

async function loadCatalog() {
  if (existsSync(CATALOG)) {
    try {
      return JSON.parse(await readFile(CATALOG, 'utf8'));
    } catch {
      /* rebuild */
    }
  }
  return { updated: null, songs: {} };
}

async function scanDir(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const name of await readdir(dir)) {
    const c = classify(name);
    if (!c) continue;
    (out[c.title] ||= {})[c.kind] = path.join(dir, name);
  }
  return out;
}

async function run() {
  await mkdir(STAGE, { recursive: true });
  const cat = await loadCatalog();

  // Merge what's in Downloads (new) + what's already staged (done).
  const fromDL = REPORT_ONLY ? {} : await scanDir(DL);
  for (const [title, kinds] of Object.entries(fromDL)) {
    // SAFETY ANCHOR: treat a title as a Suno song when its "<Title>.wav" is
    // present (every Suno export has a WAV) OR when a staging dir for it already
    // exists (so a late loose asset — e.g. an mp4 re-grabbed in the cleanup pass —
    // gets absorbed into the already-staged song). Unrelated media (bare
    // ghost-evidence-*.mp4 with no wav and no staging dir) is left in ~/Downloads.
    const s = slug(title);
    if (!kinds.wav && !existsSync(path.join(STAGE, s))) continue;
    const dest = path.join(STAGE, s);
    await mkdir(dest, { recursive: true });
    const rec = (cat.songs[title] ||= { slug: s, assets: {} });
    for (const [kind, src] of Object.entries(kinds)) {
      const to = path.join(dest, path.basename(src));
      try {
        if (src !== to && existsSync(src)) await rename(src, to);
      } catch {
        /* cross-device? leave in place */
      }
      const final = existsSync(to) ? to : src;
      rec.assets[kind] = { file: final, bytes: existsSync(final) ? (await stat(final)).size : 0 };
    }
  }

  // Re-scan staging so the catalog reflects reality even on --report.
  for (const s of existsSync(STAGE) ? await readdir(STAGE) : []) {
    const dir = path.join(STAGE, s);
    if (!existsSync(dir) || !(await stat(dir)).isDirectory()) continue;
    const kinds = await scanDir(dir);
    for (const [title, k] of Object.entries(kinds)) {
      const rec = (cat.songs[title] ||= { slug: slug(title), assets: {} });
      for (const [kind, src] of Object.entries(k))
        rec.assets[kind] = { file: src, bytes: (await stat(src)).size };
    }
  }

  // Status per song: "complete" = has wav + mp4 + stems (the 3 the .mov downloads).
  const CORE = ['wav', 'mp4', 'stems'];
  for (const rec of Object.values(cat.songs)) {
    const have = Object.keys(rec.assets);
    rec.missing = CORE.filter(k => !have.includes(k));
    rec.status = rec.missing.length === 0 ? 'complete' : 'partial';
  }
  cat.updated = null; // stamped by caller if needed (Date.now unavailable here is fine)

  if (!REPORT_ONLY) await writeFile(CATALOG, JSON.stringify(cat, null, 2));

  const songs = Object.entries(cat.songs);
  const done = songs.filter(([, r]) => r.status === 'complete');
  console.log(
    `catalog: ${songs.length} songs tracked · ${done.length} complete · ${songs.length - done.length} partial`
  );
  for (const [title, r] of songs) {
    const tag = r.status === 'complete' ? '✓' : '…';
    console.log(
      `  ${tag} ${title}  [${Object.keys(r.assets).join(',') || 'none'}]${r.missing.length ? '  missing: ' + r.missing.join(',') : ''}`
    );
  }
  console.log(`\nstaging: ${STAGE}\ncatalog: ${CATALOG}`);
}

run().catch(e => {
  console.error('suno-asset-sync FAILED:', e.message);
  process.exit(1);
});
