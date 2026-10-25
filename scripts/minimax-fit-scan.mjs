#!/usr/bin/env node
// scripts/minimax-fit-scan.mjs
// ---------------------------------------------------------------------------
// Rank the catalog by MiniMax-FIT, not generic video potential.
//
// MiniMax Hailuo-02's distinguishing trait (per [[music-video-production]]) is
// that it is the PERMISSIVE, 1080p, fast rail that renders what Seedance's
// COPYRIGHT + CONTENT checkers REJECT: dragons/beasts/monsters, fire/pits/hell,
// gore/blood/war carnage, demonic/horned imagery, explicit violence. Seedance is
// otherwise the higher-quality default — so a song only NEEDS MiniMax when its
// FAITHFUL visual concept contains Seedance-forbidden content.
//
// This scans each track's REAL lyrics (public/lyrics/<id>.json, Whisper-aligned)
// + vibe + title + wisdom for those families and ranks by the FORBIDDEN score.
// Spectacle terms are reported as secondary context (MiniMax handles them well
// but so does Seedance, so they don't REQUIRE MiniMax).
// ---------------------------------------------------------------------------
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { TRACKS } from '../src/data.ts';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LYR = path.join(ROOT, 'public', 'lyrics');

// Already made / published → exclude from "make next" recommendations.
const DONE = new Set([
  'border-mercy', // has Track.video, was MiniMax
  'bermuda-prophecy', // has Track.video
  'atlantis-crossfire', 'luminous-love', 'wexford-bridge',
  'other-side-of-the-fall', 'two-friends-two-hunnies', 'reckless-grace',
  'i-killed-your-dragon' // delivered all-Seedance (dragon rendered obliquely to dodge the checker)
]);

// FORBIDDEN-by-Seedance families → the REAL MiniMax differentiator (weight 3).
const FORBIDDEN = {
  'beast/creature': /\b(beast|beasts|monster|monsters|creature|creatures|serpent|leviathan|hydra|kraken|dragon|dragons|wolf|wolves|lion|lions|snake|snakes|vulture|raven)\b/gi,
  'demon/horned': /\b(demon|demons|demonic|devil|devils|horn|horns|horned|hell|hellfire|brimstone|damned|condemned|cursed|curse|abyss|underworld|satan|lucifer)\b/gi,
  'fire/pit': /\b(fire|fires|flame|flames|burn|burns|burning|burned|ember|embers|wildfire|inferno|blaze|blazing|scorch|scorched|furnace|coal|coals|lava|pit|pits|smoke|smolder|ash|ashes)\b/gi,
  'gore/violence': /\b(blood|bloody|bleed|bleeding|gore|wound|wounds|wounded|carnage|slay|slain|slaughter|stab|stabbed|corpse|coffin|grave|graves|graveyard|bone|bones|skull|skulls)\b/gi,
  'war/weapon': /\b(war|wars|battle|battles|battlefield|soldier|soldiers|gun|guns|rifle|bullet|bullets|sword|swords|blade|blades|knife|knives|spear|arrow|arrows|trench|trenches|siege|cannon)\b/gi,
  'chains/captivity': /\b(chain|chains|chained|shackle|shackles|cage|caged|bound|captive|prisoner|dungeon|iron)\b/gi
};

// SPECTACLE families → MiniMax does them well, but Seedance does too (weight 1, context only).
const SPECTACLE = {
  cosmic: /\b(cosmos|cosmic|nebula|galaxy|galaxies|star|stars|starlight|supernova|orbit|planet|planets|void|celestial|comet|meteor|black.?hole|event.?horizon)\b/gi,
  storm: /\b(storm|storms|lightning|thunder|hurricane|tornado|flood|floods|tsunami|tempest|quake|earthquake)\b/gi,
  royalty: /\b(crown|crowned|throne|king|kings|queen|queens|empire|kingdom|emperor|royal|reign|scepter)\b/gi,
  sea: /\b(ocean|oceans|sea|seas|tide|tides|wave|waves|leviathan|shore|depths|drown|drowning|current|abyssal)\b/gi,
  sacredAwe: /\b(angel|angels|halo|cathedral|temple|heaven|heavens|holy|divine|seraph|glory|radiant|radiance|god.?rays)\b/gi
};

function scan(text, families) {
  const hits = {};
  let total = 0;
  for (const [name, re] of Object.entries(families)) {
    const m = text.match(re);
    if (m && m.length) {
      // de-dupe by lowercased term, keep counts
      const counts = {};
      for (const w of m) counts[w.toLowerCase()] = (counts[w.toLowerCase()] || 0) + 1;
      hits[name] = counts;
      total += m.length;
    }
  }
  return { hits, total };
}

async function lyricsText(id) {
  const f = path.join(LYR, `${id}.json`);
  if (!existsSync(f)) return '';
  try {
    const j = JSON.parse(await readFile(f, 'utf8'));
    if (Array.isArray(j.words)) return j.words.map(w => w.w).join(' ');
    if (Array.isArray(j.lines)) return j.lines.map(l => l.text || l).join(' ');
    return '';
  } catch {
    return '';
  }
}

function exampleLines(lyr, families) {
  // Return up to 2 short lyric fragments that contain a forbidden term.
  const terms = [];
  for (const re of Object.values(families)) {
    const m = lyr.match(re);
    if (m) terms.push(...m.map(x => x.toLowerCase()));
  }
  if (!terms.length) return [];
  const uniq = [...new Set(terms)];
  const sentences = lyr.split(/(?<=[.?!])\s+|\s{2,}/).filter(Boolean);
  const out = [];
  for (const s of sentences) {
    if (uniq.some(t => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s))) {
      const trimmed = s.trim().replace(/\s+/g, ' ').slice(0, 90);
      if (trimmed.length > 8) out.push(trimmed);
    }
    if (out.length >= 2) break;
  }
  return out;
}

const rows = [];
for (const t of TRACKS) {
  const lyr = await lyricsText(t.id);
  const meta = [t.title, t.vibe || '', t.wisdom || ''].join('  ');
  const corpus = `${meta}  ${lyr}`;
  const f = scan(corpus, FORBIDDEN);
  const s = scan(corpus, SPECTACLE);
  const score = f.total * 3 + s.total; // forbidden dominates
  rows.push({
    id: t.id,
    title: t.title,
    album: t.album,
    vibe: t.vibe || '',
    done: DONE.has(t.id),
    hasLyrics: lyr.length > 0,
    forbidden: f.total,
    forbiddenFamilies: Object.keys(f.hits),
    forbiddenHits: f.hits,
    spectacle: s.total,
    spectacleFamilies: Object.keys(s.hits),
    score,
    examples: exampleLines(lyr || meta, FORBIDDEN)
  });
}

rows.sort((a, b) => b.forbidden - a.forbidden || b.score - a.score);

const fmtHits = h =>
  Object.entries(h)
    .map(([fam, counts]) => `${fam}[${Object.entries(counts).map(([w, c]) => (c > 1 ? `${w}×${c}` : w)).join(',')}]`)
    .join(' ');

console.log(`\nScanned ${rows.length} tracks · ${rows.filter(r => r.hasLyrics).length} with aligned lyrics\n`);
console.log('═══ TOP MINIMAX-FIT (Seedance-forbidden imagery; ★=already made/skip) ═══\n');
let shown = 0;
for (const r of rows) {
  if (r.forbidden === 0) break;
  shown++;
  if (shown > 32) break;
  const tag = r.done ? '★DONE' : '     ';
  console.log(
    `${tag} ${String(r.forbidden).padStart(3)}f ${String(r.spectacle).padStart(2)}s  ${r.id}  —  "${r.title}" [${r.album}]`
  );
  console.log(`        vibe: ${r.vibe}`);
  console.log(`        ${fmtHits(r.forbiddenHits)}`);
  if (r.spectacleFamilies.length) console.log(`        +spectacle: ${r.spectacleFamilies.join(', ')}`);
  for (const ex of r.examples) console.log(`        ∟ "${ex}"`);
  console.log();
}

// Tracks with NO lyrics file (can't scan ground truth — flag so I verify manually)
const noLyr = rows.filter(r => !r.hasLyrics).map(r => r.id);
if (noLyr.length) console.log(`\n(No aligned-lyrics file for ${noLyr.length}: ${noLyr.join(', ')})`);
