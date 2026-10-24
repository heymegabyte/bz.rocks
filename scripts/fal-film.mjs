#!/usr/bin/env node
// scripts/fal-film.mjs
// ---------------------------------------------------------------------------
// Build a full song-length cinematic FILM for a bz.rocks track via Fal.ai:
//   flux-pro/v1.1 keyframe (16:9) → kling-video v2.5-turbo/pro image-to-video
//   (10s, 1080p) per scene, xfade-concat into a reel, score with the full song.
//
// Fal rail (FAL_ADMIN_API_KEY via get-secret) runs MiniMax Hailuo-class i2v +
// hyper-real Kling. Queue API: POST queue.fal.run/<model> → {status_url,
// response_url} (used verbatim). Per memory reference-asset-and-email-rails.
//
// Resumable + cost-safe: any keyframe/clip already cached is NOT regenerated.
// Concurrency-limited so we never trip Fal's queue. ffmpeg logic mirrors
// scripts/minimax-music-videos.mjs (normalize → xfade reel → score).
//
// Usage:  node scripts/fal-film.mjs                 # generate + stitch
//         STITCH_ONLY=1 node scripts/fal-film.mjs   # re-stitch cached clips
// ---------------------------------------------------------------------------
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(ROOT, '.cache', 'fal');
const FRAMES = path.join(CACHE, 'frames');
const CLIPS = path.join(CACHE, 'clips');
const NORM = path.join(CACHE, 'norm');
const OUT = path.join(CACHE, 'out');
const HOME = process.env.HOME;

const KF_MODEL = 'fal-ai/flux-pro/v1.1';
const I2V_MODEL = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
const DURATION = '10';
const CONCURRENCY = 7;
const XFADE = 0.55;

const TRACK = {
  id: 'atlantis-crossfire',
  title: 'Atlantis Crossfire',
  audio: 'public/audio/Atlantis_Crossfire.mp3'
};

// Standing brief (MUSIC-VIDEO-PLAN.md): every film is hyper-real, HBO-level, and
// stars a recurring beautiful MULTICULTURAL WOMAN as the lead/witness — dignified,
// never exploitative. For a new song, cast her into the SCENES (keyframe subjects)
// and keep this HBO style suffix on every keyframe. (Atlantis below is mythic /
// seascape — it predates the woman-lead brief and is already rendered.)
const STYLE =
  ' — hyper-realistic, HBO-level cinematic production, teal-and-amber color grade, chrome and bioluminescence, anamorphic 35mm, volumetric god-rays, fine film grain, ultra-detailed, dark apocalyptic awe, no text, no watermark.';

// 28 beats tracing the lyric arc: seam → time bends → silver tide → pull the
// cross → Atlantis rises → won by flood/blood → coral & crown → sea makes a god.
// scene = [keyframe subject, kling motion prompt]
const SCENES = [
  [
    'A black ocean at blue hour, a hairline seam of cold light splitting the deep, storm clouds stacked to the horizon, vast and silent',
    'Slow cinematic push-in toward the seam of light, faint swell rising, mist drifting, ominous stillness breaking.'
  ],
  [
    'A swarm of tiny glowing drones like sparks slipping through a glowing fracture in black water',
    'The camera drifts with the swarm as the sparks pour through the seam, trails of light, weightless and eerie.'
  ],
  [
    'Immense clockwork gears of light turning slowly inside a towering storm cloud over the sea',
    'Slow orbit around the turning gears of light, time itself grinding, lightning flickering behind.'
  ],
  [
    'A single spark of light held in a colossal hand formed of water and foam, above the waves',
    'Gentle push-in on the spark in the water-hand, embers lifting, calm and cold before the storm.'
  ],
  [
    'The night sky cracking like black glass, a jagged lightning fracture spreading over the ocean',
    'Fast dramatic crane upward as the sky fractures, the crack racing across the frame, thunder shock.'
  ],
  [
    'A silver mercury-like tide surging upward into a towering vertical wall of liquid metal',
    'Rising crane as the silver tide surges straight up, reflections warping, overwhelming scale.'
  ],
  [
    'Drowned cathedral spires breaking the ocean surface, water sheeting off ancient black stone',
    'Slow majestic crane up the breaching spires, waterfalls pouring off stone, god-rays cutting through.'
  ],
  [
    'A colossal ancient cross rising from the seabed wrapped in kelp and chains, light behind it',
    'Slow reverent push-in on the rising cross, silt and bubbles streaming, shafts of light behind.'
  ],
  [
    'A throne of coral and rusted iron on the ocean floor, a crown of foam descending toward it',
    'Slow orbit around the coral-iron throne as the crown of foam lowers, particles drifting in the current.'
  ],
  [
    'An entire submerged city breaching the surface, waterfalls off every rooftop, dawn god-rays',
    'Epic rising crane reveal of Atlantis breaching, sheets of water falling, light exploding over the city.'
  ],
  [
    'A holy and terrible flood sweeping over a ruined coastline under a bruised sky',
    'Fast tracking push over the flood as it sweeps the ruins, spray and debris, awe and dread.'
  ],
  [
    'Deep red bioluminescence blooming through dark ocean water like slow fire',
    'Slow drift through the blooming red light, tendrils unfurling, hypnotic and foreboding.'
  ],
  [
    'Thousands of little lights scattered across black abyssal sand on the ocean floor',
    'Low slow glide over the field of little lights in the sand, dust stirring, quiet wonder.'
  ],
  [
    'Iron nails lifting out of weathered dark wood, gold light pouring from the empty holes',
    'Macro slow push-in as the nails lift free and gold light floods out of the wood, sacred.'
  ],
  [
    'Old wooden beams turning to molten glowing gold, grain lit from within',
    'Slow rack focus as the wood transmutes to gold, light crawling along the grain, radiant.'
  ],
  [
    'A broken kneeling figure given a glowing handhold on a rising ledge of light underwater',
    'Gentle crane up with the rising ledge, the figure lifted, hopeful warm light growing.'
  ],
  [
    'The sea opening like a vast mouth into a towering tunnel of standing water',
    'Push-in into the opening sea-mouth, walls of water towering either side, breathless scale.'
  ],
  [
    'A golden crown glinting in white sea-foam on the crest of a huge black wave',
    'Slow motion as the wave crests and the crown glints in the foam, spray frozen in light.'
  ],
  [
    'A ruined underwater hall transformed into a radiant throne room of coral and gold light',
    'Slow elegant dolly through the radiant throne room, light beams sweeping, regal and still.'
  ],
  [
    'Macro of living coral growing over a rusted shipwreck hull, bioluminescent and alive',
    'Extreme slow macro creep across the coral and iron, tiny lights pulsing, intimate and strange.'
  ],
  [
    'Stars suspended and reflected inside briny black water, a galaxy beneath the sea',
    'Slow drift through the underwater stars, points of light parallaxing, infinite and calm.'
  ],
  [
    'A luminous robed figure walking unhurried through deep blue water, light trailing',
    'Slow tracking dolly alongside the walking figure, god-rays crossing, serene power.'
  ],
  [
    'Rows of chrome saints kneeling in a vast submerged nave, bowing toward a far light',
    'Slow push down the nave over the kneeling chrome saints, light swelling at the far end.'
  ],
  [
    'A triangle-shaped tide of pure light washing dust and shadow off a weathered face',
    'Slow push-in as the triangle of light washes over, shadow peeling away, cleansing glow.'
  ],
  [
    'A door of brilliant light opening in the pitch-black abyss, radiance spilling out',
    'Slow push toward the opening door of light in the abyss, rays flooding the dark, awe.'
  ],
  [
    'A silhouetted king on a throne as the sea itself crowns him with foam and light',
    'Slow rising crane on the crowned silhouette, water curling into a crown, triumphant dread.'
  ],
  [
    'The black abyss trembling with visible sound waves, vast rings rippling through the water',
    'Slow pull-back as sound waves ripple out through the abyss, immense and resonant, building.'
  ],
  [
    'Atlantis fully risen beneath a breaking golden dawn, calm water, triumphant and eternal',
    'Graceful wide pull-back reveal of risen Atlantis at dawn, motion easing to a held, glowing stillness.'
  ]
];

const log = (...a) => console.log(`[fal-film ${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function token() {
  if (process.env.FAL_ADMIN_API_KEY) return process.env.FAL_ADMIN_API_KEY.trim();
  const { stdout } = await execFileP('/Users/Apple/.local/bin/get-secret', ['FAL_ADMIN_API_KEY']);
  if (!stdout.trim()) throw new Error('FAL_ADMIN_API_KEY not available');
  return stdout.trim();
}

async function falRun(tok, model, input, label, maxPollMs) {
  const H = { Authorization: `Key ${tok}`, 'Content-Type': 'application/json' };
  let sj;
  for (let tries = 0; tries < 8; tries++) {
    const res = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify(input)
    });
    sj = await res.json().catch(() => ({}));
    if (res.ok && sj.status_url) break;
    if (res.status === 429 || res.status === 503) {
      log(`${label}: busy (${res.status}), backing off`);
      await sleep(12000);
      continue;
    }
    throw new Error(`${label}: submit ${res.status} ${JSON.stringify(sj).slice(0, 200)}`);
  }
  if (!sj?.status_url) throw new Error(`${label}: no status_url after retries`);
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxPollMs) throw new Error(`${label}: timed out`);
    await sleep(4000);
    const st = await (await fetch(sj.status_url, { headers: H })).json().catch(() => ({}));
    if (st.status === 'COMPLETED') break;
    if (st.status === 'FAILED' || st.status === 'ERROR')
      throw new Error(`${label}: ${st.status} ${JSON.stringify(st).slice(0, 200)}`);
  }
  return fetch(sj.response_url, { headers: H }).then(r => r.json());
}

async function keyframe(tok, i) {
  const dest = path.join(FRAMES, `${TRACK.id}-${i}.jpg`);
  if (existsSync(dest)) {
    log(`kf#${i}: cached ✓`);
    return dest;
  }
  const r = await falRun(
    tok,
    KF_MODEL,
    { prompt: SCENES[i][0] + STYLE, image_size: 'landscape_16_9', num_images: 1, safety_tolerance: '5' },
    `kf#${i}`,
    3 * 60 * 1000
  );
  const url = r?.images?.[0]?.url;
  if (!url) throw new Error(`kf#${i}: no image url`);
  await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
  log(`kf#${i}: ready`);
  return dest;
}

async function clip(tok, i) {
  const dest = path.join(CLIPS, `${TRACK.id}-${i}.mp4`);
  if (existsSync(dest) && (await stat(dest)).size > 100_000) {
    log(`clip#${i}: cached ✓`);
    return dest;
  }
  const frame = await keyframe(tok, i);
  const uri = `data:image/jpeg;base64,${(await readFile(frame)).toString('base64')}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await falRun(
        tok,
        I2V_MODEL,
        { prompt: SCENES[i][1], image_url: uri, duration: DURATION },
        `clip#${i}`,
        8 * 60 * 1000
      );
      const vurl = r?.video?.url || r?.video_url || r?.videos?.[0]?.url;
      if (!vurl) throw new Error(`clip#${i}: no video url ${JSON.stringify(r).slice(0, 160)}`);
      await writeFile(dest, Buffer.from(await (await fetch(vurl)).arrayBuffer()));
      log(`clip#${i}: done`);
      return dest;
    } catch (e) {
      log(`clip#${i}: attempt ${attempt} failed — ${e.message}`);
      if (attempt === 2) throw e;
      await sleep(5000);
    }
  }
}

// Bounded-concurrency map.
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(i);
      }
    })
  );
  return out;
}

async function ff(args) {
  await execFileP('ffmpeg', ['-nostdin', '-y', ...args], { maxBuffer: 1 << 27 });
}
async function probeDuration(f) {
  const { stdout } = await execFileP('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    f
  ]);
  return parseFloat(stdout.trim());
}

async function normalize(clipPath, dest) {
  await ff([
    '-i',
    clipPath,
    '-vf',
    'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,vignette=angle=PI/5,noise=alls=2:allf=t+u,format=yuv420p',
    '-an',
    '-c:v',
    'libx264',
    '-crf',
    '17',
    '-preset',
    'medium',
    dest
  ]);
}

async function buildReel(norms, dest) {
  const durs = [];
  for (const n of norms) durs.push(await probeDuration(n));
  const inputs = norms.flatMap(n => ['-i', n]);
  let filter = '',
    prev = '0:v',
    acc = durs[0];
  for (let i = 1; i < norms.length; i++) {
    const offset = (acc - XFADE).toFixed(3);
    const out = i === norms.length - 1 ? 'vout' : `v${i}`;
    filter += `[${prev}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset}[${out}];`;
    acc = acc + durs[i] - XFADE;
    prev = out;
  }
  filter = filter.replace(/;$/, '');
  await ff([
    ...inputs,
    '-filter_complex',
    filter,
    '-map',
    '[vout]',
    '-c:v',
    'libx264',
    '-crf',
    '17',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    dest
  ]);
  return acc;
}

async function scoreReel(reel, audio, reelDur, dest) {
  const fadeOut = Math.max(0, reelDur - 2.5).toFixed(2);
  await ff([
    '-i',
    reel,
    '-i',
    path.join(ROOT, audio),
    '-filter_complex',
    `[1:a]atrim=0:${reelDur.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.0,afade=t=out:st=${fadeOut}:d=2.5,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    '-map',
    '0:v',
    '-map',
    '[a]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    '-shortest',
    dest
  ]);
}

async function run() {
  // Cost guard — never regenerate a track that already has a video (~$21 each).
  // See scripts/video-manifest.json. Override with FORCE=1; re-stitch with STITCH_ONLY=1.
  if (!process.env.STITCH_ONLY && !process.env.FORCE) {
    try {
      const mf = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'video-manifest.json'), 'utf8'));
      if (mf.done?.[TRACK.id]) {
        console.error(
          `[fal-film] ${TRACK.id} ALREADY has a video → ${mf.done[TRACK.id].file}\n` +
            `Refusing to spend ~$21. Set FORCE=1 to override, STITCH_ONLY=1 to re-stitch cached clips.`
        );
        process.exit(0);
      }
    } catch {
      /* no manifest — proceed */
    }
  }
  for (const d of [FRAMES, CLIPS, NORM, OUT]) await mkdir(d, { recursive: true });

  // Reuse the validated smoke keyframe+clip as scene 0 (free; its prompt matches).
  if (!process.env.STITCH_ONLY) {
    const sk = path.join(FRAMES, '_smoke.jpg'),
      sc = path.join(CLIPS, '_smoke.mp4');
    if (existsSync(sk) && !existsSync(path.join(FRAMES, `${TRACK.id}-0.jpg`)))
      await copyFile(sk, path.join(FRAMES, `${TRACK.id}-0.jpg`));
    if (existsSync(sc) && !existsSync(path.join(CLIPS, `${TRACK.id}-0.mp4`)))
      await copyFile(sc, path.join(CLIPS, `${TRACK.id}-0.mp4`));
  }

  let clips;
  if (process.env.STITCH_ONLY) {
    clips = SCENES.map((_, i) => path.join(CLIPS, `${TRACK.id}-${i}.mp4`));
    for (const c of clips) if (!existsSync(c)) throw new Error(`STITCH_ONLY but missing ${c}`);
  } else {
    const tok = await token();
    log(`generating ${SCENES.length} scenes (keyframe + 10s clip each), concurrency ${CONCURRENCY}…`);
    clips = await pool(SCENES, CONCURRENCY, i => clip(tok, i));
  }

  log(`normalizing ${clips.length} clips…`);
  const norms = [];
  for (let i = 0; i < clips.length; i++) {
    const n = path.join(NORM, `${TRACK.id}-${i}.mp4`);
    await normalize(clips[i], n);
    norms.push(n);
  }

  const reel = path.join(OUT, `${TRACK.id}.reel.mp4`);
  log('building xfade reel…');
  const reelDur = await buildReel(norms, reel);

  const final = path.join(OUT, `${TRACK.id}.mp4`);
  log(`scoring (${reelDur.toFixed(1)}s) + final encode…`);
  await scoreReel(reel, TRACK.audio, reelDur, final);

  const deskDest = path.join(HOME, 'Desktop', `${TRACK.id}-film.mp4`);
  await copyFile(final, deskDest);
  const sz = (await stat(final)).size;
  log(
    `✅ ${TRACK.id} → ${path.relative(ROOT, final)} + ~/Desktop/${TRACK.id}-film.mp4 (${(sz / 1e6).toFixed(1)} MB, ${reelDur.toFixed(1)}s)`
  );
}

run().catch(e => {
  console.error('\n[fal-film] FAILED:', e.message);
  process.exit(1);
});
