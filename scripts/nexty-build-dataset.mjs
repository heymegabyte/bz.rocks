#!/usr/bin/env node
// scripts/nexty-build-dataset.mjs
// ---------------------------------------------------------------------------
// Integrate the 42 new "nexty" songs into the site as 3 albums of 14:
//   • splice COVERS + 3 Album literals + 42 Track literals into src/data.ts
//   • append 42 SUNO_META entries into src/suno-meta.ts
//   • write public/lyrics/<id>.json (estimated word-timing — same algorithm the
//     app uses as its own fallback) for every lyrical track, so the build gate
//     audit-track-assets.ts passes and karaoke follows along
//   • copy each song's mp3 → public/audio/<id>.mp3
// Source of truth: ~/Desktop/suno-assets/nexty-lyrics.json (clip API) + the
// per-slug staging dirs. Idempotent-ish: refuses to double-insert (checks for a
// sentinel track id already present in data.ts).
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STAGE = path.join(process.env.HOME, 'Desktop', 'suno-assets');
const LYR = JSON.parse(readFileSync(path.join(STAGE, 'nexty-lyrics.json'), 'utf8'));
const BY_SLUG = new Map(LYR.map(r => [r.slug, r]));

// ── Album definitions ──────────────────────────────────────────────────────
const ALBUMS_DEF = [
  {
    id: 'wake-up-alice',
    name: 'Wake Up, Alice',
    cover: '/art/cover-wake-up-alice.jpg',
    tagline: 'Fourteen dispatches from the looking-glass ward',
    description:
      'A wonderland-noir concept album for anyone the system called crazy. Alice at the cracked mirror, the rabbit that was only ever a rabbit, the Grays at the last-call hub, the control room behind your own eyes — fourteen cinematic awakenings that trade the conspiracy for the truth and walk back out the door. The mirror never knew your name. Come home.',
    // wake-up-alice: cold electric periwinkle — looking-glass ward-light blue,
    // neon-bright on #060610, distinct from the cyan/mint family.
    accent: '#7AA2FF',
    releasedAt: '2026-10-18'
  },
  {
    id: 'the-pause',
    name: 'The Pause',
    cover: '/art/cover-the-pause.jpg',
    tagline: 'Fourteen breaths between the thought and the word',
    description:
      'Wise-mind gospel for the recovery hour. Facts before fear, one breath and one step, peace practiced like an instrument — fourteen songs that find the space Viktor Frankl promised between stimulus and response, and choose grace inside it. The righteous fall seven times and rise again; the stars don’t rise all at once. Be still, and begin.',
    // the-pause: serene neon lavender — calm dawn-of-mind violet, distinct from
    // the pinker appeal accent.
    accent: '#B49CFF',
    releasedAt: '2026-10-04'
  },
  {
    id: 'little-lanterns',
    name: 'Little Lanterns',
    cover: '/art/cover-little-lanterns.jpg',
    tagline: 'Fourteen small lights carried for the least of these',
    description:
      'Mercy-tree gospel and tender lantern-light. God pointed at the poor, the mercy tree where we promised peace, this little light that refuses to go out — fourteen songs about what we give being what makes a life. Hundred books, one life; a little for me; stars that never asked permission to shine. Let your light shine before others.',
    // little-lanterns: warm neon amber — lantern-glow gold, the warm pole of the
    // trilogy against the two cool albums.
    accent: '#FFAE57',
    releasedAt: '2026-09-20'
  }
];

// ── Track plan: ordered per album. src = source slug in nexty-lyrics.json. ──
// title override only when the on-site title differs from the Suno title
// (alt-mix differentiation). vibe = short lowercase descriptor; wisdom = quote.
const PLAN = {
  'wake-up-alice': [
    {
      id: 'wake-up-alice',
      src: 'wake-up-alice',
      vibe: 'whispered wonderland reveille',
      wisdom: '“Wake, O sleeper, and Christ will shine on you.” — Ephesians 5:14'
    },
    {
      id: 'the-rabbit-is-only-a-rabbit',
      src: 'the-rabbit-is-only-a-rabbit-5-51',
      vibe: 'white-ward dark-pop ballad',
      wisdom: '“You’re entirely bonkers. But all the best people are.” — Lewis Carroll'
    },
    {
      id: 'the-rabbit-ward-mix',
      src: 'the-rabbit-is-only-a-rabbit-5-56',
      title: 'The Rabbit Is Only A Rabbit (Ward Mix)',
      vibe: 'music-box ward reprise',
      wisdom: '“Sometimes I’ve believed as many as six impossible things before breakfast.” — Lewis Carroll'
    },
    {
      id: 'the-rabbit-looking-glass-mix',
      src: 'the-rabbit-is-only-a-rabbit-6-02',
      title: 'The Rabbit Is Only A Rabbit (Looking-Glass Mix)',
      vibe: 'cello-haunted looking-glass take',
      wisdom: '“If you don’t know where you’re going, any road will take you there.” — Lewis Carroll'
    },
    {
      id: 'the-possessed-class',
      src: 'the-possessed-class',
      vibe: 'paranoid trap-soul catechism',
      wisdom: '“Perfect love casts out fear.” — 1 John 4:18'
    },
    {
      id: 'control-room-in-your-mind',
      src: 'control-room-in-your-mind',
      vibe: 'child-whisper control-room trap',
      wisdom: '“You have power over your mind — not outside events.” — Marcus Aurelius'
    },
    {
      id: 'the-alien-me-show',
      src: 'the-alien-me-show',
      vibe: 'surveilled-identity orchestral trap',
      wisdom: '“Be yourself; everyone else is already taken.” — Oscar Wilde'
    },
    {
      id: 'the-7-11-prophecy',
      src: 'the-7-11-prophecy',
      title: 'The 7/11 Prophecy',
      vibe: 'alliterative gospel-prophecy piano',
      wisdom: '“Where there is no vision, the people perish.” — Proverbs 29:18'
    },
    {
      id: 'above-the-grays',
      src: 'above-the-grays',
      vibe: 'new-world-order gospel-trap memoir',
      wisdom: '“The truth will set you free.” — John 8:32'
    },
    {
      id: 'above-the-grays-nightfall',
      src: 'above-the-grays-5-29',
      title: 'Above The Grays (Nightfall Mix)',
      vibe: 'orchestral-trap extended dusk',
      wisdom: '“The light shines in the darkness, and the darkness has not overcome it.” — John 1:5'
    },
    {
      id: 'last-call-at-the-hub',
      src: 'last-call-at-the-hub-5-21',
      vibe: 'cosmic-noir departures lounge',
      wisdom: '“Two roads diverged in a wood, and I took the one less traveled by.” — Robert Frost'
    },
    {
      id: 'last-call-at-the-hub-late',
      src: 'last-call-at-the-hub-5-36',
      title: 'Last Call at the Hub (Late Mix)',
      vibe: 'after-hours black-glass jazz',
      wisdom: '“The cave you fear to enter holds the treasure you seek.” — Joseph Campbell'
    },
    {
      id: 'find-me-on-algenib',
      src: 'find-me-on-algenib',
      vibe: 'star-refuge club anthem',
      wisdom: '“When I consider your heavens… what is man that you are mindful of him?” — Psalm 8:3-4'
    },
    {
      id: 'dont-let-the-future-call-us',
      src: 'dont-let-the-future-call-us',
      vibe: 'alliterative anti-war indictment',
      wisdom: '“Blessed are the peacemakers, for they shall be called children of God.” — Matthew 5:9'
    }
  ],
  'the-pause': [
    {
      id: 'facts-before-fear',
      src: 'facts-before-fear',
      vibe: 'cbt cinematic soul-hop',
      wisdom: '“We suffer more in imagination than in reality.” — Seneca'
    },
    {
      id: 'clear-mind-kind-heart',
      src: 'clear-mind-kind-heart',
      vibe: 'grounding piano-soul',
      wisdom:
        '“Watch over your heart with all diligence, for from it flow the springs of life.” — Proverbs 4:23'
    },
    {
      id: 'peace-is-a-practice',
      src: 'peace-is-a-practice',
      vibe: 'tropical-house breathwork',
      wisdom: '“You will keep in perfect peace those whose minds are steadfast.” — Isaiah 26:3'
    },
    {
      id: 'one-breath-one-step',
      src: 'one-breath-one-step',
      vibe: 'ready-to-begin piano-pop',
      wisdom: '“The journey of a thousand miles begins with a single step.” — Lao Tzu'
    },
    {
      id: 'one-at-a-time',
      src: 'one-at-a-time',
      vibe: 'pharmacy-line gospel-pop',
      wisdom: '“Do the next right thing.” — recovery proverb'
    },
    {
      id: 'one-small-move',
      src: 'one-small-move',
      vibe: 'mountain-in-the-mind soul',
      wisdom: '“Little by little, one walks far.” — Peruvian proverb'
    },
    {
      id: 'pause',
      src: 'pause',
      vibe: 'ambient be-still meditation',
      wisdom:
        '“Between stimulus and response there is a space, and in that space is our freedom.” — Viktor Frankl'
    },
    {
      id: 'right-here-right-now',
      src: 'right-here-right-now',
      vibe: 'present-tense trap-pop',
      wisdom: '“This is the day the Lord has made; let us rejoice and be glad in it.” — Psalm 118:24'
    },
    {
      id: 'no-vacancy',
      src: 'no-vacancy',
      vibe: 'boundary-setting melodic edm',
      wisdom: '“No is a complete sentence.” — Anne Lamott'
    },
    {
      id: 'count-me-out-count-again',
      src: 'count-me-out-count-again',
      vibe: 'cinematic comeback chant',
      wisdom: '“The righteous fall seven times and rise again.” — Proverbs 24:16'
    },
    {
      id: 'happy-anyway',
      src: 'happy-anyway',
      vibe: 'dancing-when-it-breaks trap-soul',
      wisdom: '“Weeping may stay for the night, but joy comes in the morning.” — Psalm 30:5'
    },
    {
      id: 'one-wish-left',
      src: 'one-wish-left',
      vibe: 'meteor-wish duet',
      wisdom: '“Bear one another’s burdens.” — Galatians 6:2'
    },
    {
      id: 'the-last-word',
      src: 'the-last-word',
      vibe: 'one-word trip-hop spark',
      wisdom: '“Death and life are in the power of the tongue.” — Proverbs 18:21'
    },
    {
      id: 'the-way-you-saw-the-world',
      src: 'the-way-you-saw-the-world',
      vibe: 'attic-telescope cinematic ballad',
      wisdom:
        '“The world is full of magic things, patiently waiting for our senses to grow sharper.” — W.B. Yeats'
    }
  ],
  'little-lanterns': [
    {
      id: 'god-pointed-at-the-poor',
      src: 'god-pointed-at-the-poor',
      vibe: 'judgment-day gospel-trap',
      wisdom: '“Whatever you did for the least of these, you did for me.” — Matthew 25:40'
    },
    {
      id: 'ambrosia-leavened-bread',
      src: 'ambrosia-leavened-bread',
      vibe: 'manic gospel-trap communion',
      wisdom: '“I am the bread of life.” — John 6:35'
    },
    {
      id: 'meet-me-by-the-mercy-tree',
      src: 'meet-me-by-the-mercy-tree',
      vibe: 'red-moon indie-trap vow',
      wisdom: '“Mercy triumphs over judgment.” — James 2:13'
    },
    {
      id: 'mercy-tree-gray-mix',
      src: 'mercy-tree-gray-mix',
      title: 'Mercy Tree (Gray Mix)',
      instrumental: true,
      vibe: 'instrumental gray-mix elegy',
      wisdom: '“Be still, and know that I am God.” — Psalm 46:10'
    },
    {
      id: 'this-little-light-of-mine',
      src: 'this-little-light-of-mine',
      vibe: 'infinite-blessings gospel anthem',
      wisdom: '“Let your light shine before others.” — Matthew 5:16'
    },
    {
      id: 'stars-dont-need-permission',
      src: 'stars-dont-need-permission',
      vibe: 'permission-to-shine piano-pop',
      wisdom: '“Let them shine like stars in the sky.” — Philippians 2:15'
    },
    {
      id: 'a-hundred-books-one-life',
      src: 'a-hundred-books-one-life-4-32',
      vibe: 'quixote soul-pop',
      wisdom: '“It is more blessed to give than to receive.” — Acts 20:35'
    },
    {
      id: 'a-hundred-books-longform',
      src: 'a-hundred-books-one-life-5-13',
      title: 'A Hundred Books, One Life (Longform Mix)',
      vibe: 'extended gospel-soul reprise',
      wisdom: '“A man’s life does not consist in the abundance of his possessions.” — Luke 12:15'
    },
    {
      id: 'a-little-for-me',
      src: 'a-little-for-me',
      vibe: 'lantern-not-lightning piano-soul',
      wisdom: '“Come to me, all who are weary, and I will give you rest.” — Matthew 11:28'
    },
    {
      id: 'little-lanterns',
      src: 'little-lanterns',
      vibe: 'alliterative lullaby r&b',
      wisdom: '“Your word is a lamp to my feet and a light to my path.” — Psalm 119:105'
    },
    {
      id: 'paper-planes-to-paradise',
      src: 'paper-planes-to-paradise',
      vibe: 'crumpled-wish cinematic pop',
      wisdom: '“Hope is the thing with feathers.” — Emily Dickinson'
    },
    {
      id: 'sidewalk-picasso',
      src: 'sidewalk-picasso',
      vibe: 'skating chalk-art pop-rock',
      wisdom: '“Every child is an artist.” — Pablo Picasso'
    },
    {
      id: 'watch-the-stars-come-out',
      src: 'watch-the-stars-come-out',
      vibe: 'kindness-ripple pop-edm',
      wisdom: '“No act of kindness, no matter how small, is ever wasted.” — Aesop'
    },
    {
      id: 'fourteen-fins',
      src: 'fourteen-fins',
      vibe: 'shark-pool patience gospel-pop',
      wisdom: '“In quietness and trust is your strength.” — Isaiah 30:15'
    }
  ]
};

// ── Lyric cleaning: Suno prompt → display lines[] ──────────────────────────
// Strip markdown headers (structural title/section cards), emphasis markers,
// and whole-line [stage directions]; drop pure-symbol lines.
function cleanLyrics(prompt) {
  if (!prompt) return [];
  const out = [];
  for (const raw of prompt.replace(/\r/g, '').split('\n')) {
    let l = raw.trim();
    if (!l) continue;
    if (/^#{1,6}\s+/.test(l)) continue; // markdown header = non-sung title card
    l = l
      .replace(/[*_`]+/g, '')
      .replace(/^#+\s*/, '')
      .trim(); // strip emphasis
    if (!l) continue;
    // Leading speaker/stage tag: "[Female] sung text" → "- sung text" (the
    // site's call-and-response convention); a bare "[Hook — Female]" → drop.
    const tag = l.match(/^\[([^\]]*)\]\s*(.*)$/);
    if (tag) {
      if (tag[2].trim()) l = '- ' + tag[2].trim();
      else continue;
    }
    if (/^\[/.test(l)) continue; // truncated/unclosed opening bracket (stage dir)
    l = l
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim(); // inline [..] spans
    if (!l) continue;
    if (/^\[[^\]]*\]$/.test(l)) continue; // residual whole-line bracket
    if (!/[a-zA-Z0-9]/.test(l)) continue; // pure punctuation/separators
    out.push(l);
  }
  return out;
}

// ── synthesizeBundle: replicated verbatim from src/main.ts (estimated word
// timing). Rounds to 2dp + enforces a min span so no zero-span / collapse. ──
function synthesizeBundle(lyricLines, duration) {
  const head = 1.2;
  const usable = Math.max(8, duration - head - 0.5);
  const lineWeights = lyricLines.map(t => Math.max(8, t.trim().length));
  const totalWeight = lineWeights.reduce((a, b) => a + b, 0) || 1;
  const r = n => Math.round(n * 100) / 100;
  const lines = [];
  const words = [];
  let cursor = head;
  lyricLines.forEach((text, i) => {
    const span = (lineWeights[i] / totalWeight) * usable;
    const lineStart = cursor;
    const lineEnd = cursor + span;
    lines.push({ s: r(lineStart), e: r(lineEnd), text });
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length) {
      const tokenWeights = tokens.map(w => Math.max(2, w.length));
      const tokenTotal = tokenWeights.reduce((a, b) => a + b, 0);
      let wCursor = lineStart;
      tokens.forEach((w, ti) => {
        const wSpan = (tokenWeights[ti] / tokenTotal) * span;
        const s = r(wCursor);
        const e = Math.max(r(wCursor + wSpan), s + 0.05);
        words.push({ w, s, e, line: i });
        wCursor += wSpan;
      });
    }
    cursor = lineEnd;
  });
  return { words, lines, duration: r(duration), source: 'estimated', generatedAt: null };
}

// ── TS literal helpers ─────────────────────────────────────────────────────
const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function condense(tags, n = 6) {
  return (tags || '')
    .split(/,\s*/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, n)
    .join(', ');
}
function mp3For(srcSlug) {
  const dir = path.join(STAGE, srcSlug);
  const f = readdirSync(dir).find(x => x.toLowerCase().endsWith('.mp3'));
  if (!f) throw new Error(`no mp3 in ${dir}`);
  return path.join(dir, f);
}

// ── Build everything ───────────────────────────────────────────────────────
const flat = [];
for (const [albumId, tracks] of Object.entries(PLAN))
  for (const t of tracks) flat.push({ ...t, album: albumId });
if (flat.length !== 42) throw new Error(`expected 42 tracks, got ${flat.length}`);

let data = readFileSync(path.join(ROOT, 'src/data.ts'), 'utf8');
if (data.includes("id: 'wake-up-alice'")) {
  console.error('data.ts already contains the new albums — aborting to avoid double-insert.');
  process.exit(1);
}

const coverKeyByAlbum = { 'wake-up-alice': 'alice', 'the-pause': 'pause', 'little-lanterns': 'lanterns' };
const albumCoverPath = Object.fromEntries(ALBUMS_DEF.map(a => [a.id, a.cover]));

const trackLiterals = [];
const metaLiterals = [];
let audioCopied = 0;
let lyricsWritten = 0;

flat.forEach((t, i) => {
  const row = BY_SLUG.get(t.src);
  if (!row) throw new Error(`no source row for ${t.src}`);
  const title = t.title || row.title;
  const dur = row.duration || row.durationSec || 180;
  const lyrics = t.instrumental
    ? ['( Instrumental — the Mercy Tree theme, rendered in gray )']
    : cleanLyrics(row.lyrics);
  if (!t.instrumental && lyrics.length < 2)
    throw new Error(`suspiciously empty lyrics for ${t.id} (${lyrics.length})`);
  const zone = { row: 30 + Math.floor(i / 8), col: i % 8 };

  // copy audio → public/audio/<id>.mp3
  const dest = path.join(ROOT, 'public/audio', `${t.id}.mp3`);
  copyFileSync(mp3For(t.src), dest);
  audioCopied++;

  // lyrics JSON (lyrical tracks only; instrumental skipped — audit treats it so)
  if (!t.instrumental) {
    const bundle = synthesizeBundle(lyrics, dur);
    writeFileSync(path.join(ROOT, 'public/lyrics', `${t.id}.json`), JSON.stringify(bundle));
    lyricsWritten++;
  }

  // Track literal (field order matches gen-og-cards parser: id,title,artist,file,cover,album,…)
  const lyricsTs = lyrics.map(l => `      ${q(l)}`).join(',\n');
  trackLiterals.push(
    `  {\n` +
      `    id: ${q(t.id)},\n` +
      `    title: ${q(title)},\n` +
      `    artist: 'bZ',\n` +
      `    file: '/audio/${t.id}.mp3',\n` +
      `    cover: COVERS.${coverKeyByAlbum[t.album]},\n` +
      `    album: ${q(t.album)},\n` +
      `    vibe: ${q(t.vibe)},\n` +
      `    zone: { row: ${zone.row}, col: ${zone.col} },\n` +
      `    lyrics: [\n${lyricsTs}\n    ],\n` +
      `    wisdom: ${q(t.wisdom)}\n` +
      `  }`
  );

  // SUNO_META entry
  const bpm = row.bpm ?? null;
  const key = row.musicalKey ?? null;
  metaLiterals.push(
    `  ${q(t.id)}: {\n` +
      `    sunoId: ${q(row.sunoId)},\n` +
      `    sunoTitle: ${q(row.title)},\n` +
      `    sunoConcept: null,\n` +
      `    sunoStyle: ${q(condense(row.style))},\n` +
      `    sunoStyleFull: ${q(row.style || '')},\n` +
      `    sunoDisplayTags: ${q(row.displayTags || '')},\n` +
      `    sunoBpm: ${bpm ?? 'null'},\n` +
      `    sunoBpmSource: ${bpm ? "'tag'" : 'null'},\n` +
      `    sunoKey: ${key ? q(key) : 'null'},\n` +
      `    sunoKeyConfidence: null,\n` +
      `    sunoKeySource: ${key ? "'tag'" : 'null'},\n` +
      `    sunoModel: ${row.modelMajor ? q(row.modelMajor) : 'null'},\n` +
      `    sunoModelName: ${row.modelName ? q(row.modelName) : 'null'},\n` +
      `    sunoDuration: ${row.duration ?? 'null'},\n` +
      `    sunoHasHook: ${Boolean(row.hasHook)},\n` +
      `    sunoIsRemix: ${Boolean(row.isRemix)},\n` +
      `    sunoIsInstrumental: ${Boolean(t.instrumental || row.isInstrumental)},\n` +
      `    sunoExplicit: ${Boolean(row.explicit)},\n` +
      `    sunoCreatedAt: ${row.createdAt ? q(row.createdAt) : 'null'},\n` +
      `    sunoAudioUrl: ${row.audioUrl ? q(row.audioUrl) : 'null'},\n` +
      `    sunoImageUrl: ${row.sunoImage ? q(row.sunoImage) : 'null'},\n` +
      `    sunoVideoUrl: ${row.videoUrl ? q(row.videoUrl) : 'null'},\n` +
      `    sunoHandle: ${row.handle ? q(row.handle) : 'null'},\n` +
      `    sunoUrl: ${q(row.sunoUrl)}\n` +
      `  }`
  );
});

// Album literals
const albumLiterals = ALBUMS_DEF.map(a => {
  const ids = PLAN[a.id].map(t => `      ${q(t.id)}`).join(',\n');
  return (
    `  {\n` +
    `    id: ${q(a.id)},\n` +
    `    name: ${q(a.name)},\n` +
    `    cover: ${q(a.cover)},\n` +
    `    tagline: ${q(a.tagline)},\n` +
    `    description: ${q(a.description)},\n` +
    `    accent: ${q(a.accent)},\n` +
    `    releasedAt: ${q(a.releasedAt)},\n` +
    `    trackIds: [\n${ids}\n    ]\n` +
    `  }`
  );
});

// ── Splice into data.ts ────────────────────────────────────────────────────
// 1. COVERS map: add alice/pause/lanterns before its closing brace.
data = data.replace(
  /(const COVERS = \{[\s\S]*?)(\n\};)/,
  (_m, body, close) =>
    `${body},\n  alice: '${albumCoverPath['wake-up-alice']}',\n  pause: '${albumCoverPath['the-pause']}',\n  lanterns: '${albumCoverPath['little-lanterns']}'${close}`
);

// 2. ALBUMS array: insert the 3 album literals before its closing `\n];`.
{
  const anchor = 'export const ALBUMS: Album[] = [';
  const start = data.indexOf(anchor);
  const close = data.indexOf('\n];', start);
  data = data.slice(0, close) + ',\n' + albumLiterals.join(',\n') + data.slice(close);
}

// 3. TRACKS array: insert the 42 track literals before its closing `\n];`.
{
  const anchor = 'export const TRACKS: Track[] = [';
  const start = data.indexOf(anchor);
  const close = data.indexOf('\n];', start);
  data = data.slice(0, close) + ',\n' + trackLiterals.join(',\n') + data.slice(close);
}
writeFileSync(path.join(ROOT, 'src/data.ts'), data);

// ── Append SUNO_META entries ───────────────────────────────────────────────
let meta = readFileSync(path.join(ROOT, 'src/suno-meta.ts'), 'utf8');
const metaClose = meta.lastIndexOf('\n};');
meta = meta.slice(0, metaClose) + ',\n' + metaLiterals.join(',\n') + meta.slice(metaClose);
writeFileSync(path.join(ROOT, 'src/suno-meta.ts'), meta);

console.log(`✓ spliced 3 albums + ${trackLiterals.length} tracks into data.ts`);
console.log(`✓ appended ${metaLiterals.length} SUNO_META entries`);
console.log(`✓ copied ${audioCopied} mp3s → public/audio/`);
console.log(`✓ wrote ${lyricsWritten} estimated lyrics JSON → public/lyrics/ (1 instrumental skipped)`);
