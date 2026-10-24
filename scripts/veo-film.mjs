#!/usr/bin/env node
// scripts/veo-film.mjs
// ---------------------------------------------------------------------------
// CINEMA MIND rail — turn a validated ProductionManifest into a hyper-real,
// HBO-scale music video using GOOGLE VEO 3.1 (via Fal, since the Gemini-API
// veo-3.1 preview was shut down 2026-10-22). Per shot:
//   flux-pro/v1.1 keyframe (or the HERO reference still) → fal-ai/veo3.1/
//   image-to-video (8s, 1080p, 16:9, audio OFF) → 2.39 letterbox + grain →
//   hard-cut concat → score to the original track.
//
// Continuity: ONE hero reference still of the lead; the close-up(s) animate
// FROM that still so the canonical face carries across shots. (Full film will
// use fal-ai/veo3.1/reference-to-video to lock her across every shot.)
//
// Auth: FAL_ADMIN_API_KEY via get-secret (same rail as scripts/fal-film.mjs).
// Reads: scripts/films/<id>/manifest.json  (validated by the CINEMA MIND engine).
//
// Usage:  node scripts/veo-film.mjs                 # generate preview + stitch
//         LIMIT=3 node scripts/veo-film.mjs         # cap shots (default: all)
//         STITCH_ONLY=1 node scripts/veo-film.mjs   # re-stitch cached clips (free)
// ---------------------------------------------------------------------------
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const HOME = process.env.HOME;

const FILM_ID = process.env.FILM_ID || 'i-killed-your-dragon';
const FILM_DIR = path.join(ROOT, 'scripts', 'films', FILM_ID);
const MANIFEST = path.join(FILM_DIR, 'manifest.json');
const REF = path.join(FILM_DIR, 'ref');
const CACHE = path.join(ROOT, '.cache', 'veo', FILM_ID);
const FRAMES = path.join(CACHE, 'frames');
const CLIPS = path.join(CACHE, 'clips');
const NORM = path.join(CACHE, 'norm');
const OUT = path.join(CACHE, 'out');

const KF_MODEL = 'fal-ai/flux-pro/v1.1';
const I2V_MODEL = 'fal-ai/veo3.1/image-to-video';
const CONCURRENCY = 3;
const AUDIO_REL = `public/audio/${FILM_ID}.mp3`;

// Shared keyframe look (the standing brief: hyper-real, HBO, no overlays).
const STYLE =
  ' — hyper-realistic, HBO-level cinematic, anamorphic 35mm, teal-and-amber color grade, volumetric light, fine film grain, ultra-detailed, dignified, no text, no watermark, no overlays.';

const log = (...a) => console.log(`[veo-film ${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function token() {
  if (process.env.FAL_ADMIN_API_KEY) return process.env.FAL_ADMIN_API_KEY.trim();
  const { stdout } = await execFileP('/Users/Apple/.local/bin/get-secret', ['FAL_ADMIN_API_KEY']);
  if (!stdout.trim()) throw new Error('FAL_ADMIN_API_KEY not available');
  return stdout.trim();
}

// Fal queue API — submit → poll status_url → fetch response_url. (Proven in fal-film.mjs.)
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
    throw new Error(`${label}: submit ${res.status} ${JSON.stringify(sj).slice(0, 220)}`);
  }
  if (!sj?.status_url) throw new Error(`${label}: no status_url after retries`);
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > maxPollMs) throw new Error(`${label}: timed out`);
    await sleep(5000);
    const st = await (await fetch(sj.status_url, { headers: H })).json().catch(() => ({}));
    if (st.status === 'COMPLETED') break;
    if (st.status === 'FAILED' || st.status === 'ERROR')
      throw new Error(`${label}: ${st.status} ${JSON.stringify(st).slice(0, 220)}`);
  }
  return fetch(sj.response_url, { headers: H }).then(r => r.json());
}

async function flux(tok, prompt, dest, label) {
  if (existsSync(dest)) {
    log(`${label}: keyframe cached ✓`);
    return dest;
  }
  const r = await falRun(
    tok,
    KF_MODEL,
    { prompt: prompt + STYLE, image_size: 'landscape_16_9', num_images: 1, safety_tolerance: '5' },
    label,
    3 * 60 * 1000
  );
  const url = r?.images?.[0]?.url;
  if (!url) throw new Error(`${label}: no image url ${JSON.stringify(r).slice(0, 160)}`);
  await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
  log(`${label}: keyframe ready`);
  return dest;
}

async function dataUri(file) {
  return `data:image/jpeg;base64,${(await readFile(file)).toString('base64')}`;
}

async function veoClip(tok, shot, heroFrame) {
  const dest = path.join(CLIPS, `${shot.id}.mp4`);
  if (existsSync(dest) && (await stat(dest)).size > 100_000) {
    log(`clip ${shot.id}: cached ✓`);
    return dest;
  }
  // First frame: the HERO still (identity continuity) or a per-shot flux keyframe.
  let frame;
  if (shot.useHeroAsFirstFrame && heroFrame) frame = heroFrame;
  else frame = await flux(tok, shot.keyframePrompt, path.join(FRAMES, `${shot.id}.jpg`), `kf ${shot.id}`);
  const image_url = await dataUri(frame);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await falRun(
        tok,
        I2V_MODEL,
        {
          prompt: shot.veoPrompt,
          image_url,
          duration: '8s',
          resolution: '1080p',
          aspect_ratio: '16:9',
          generate_audio: false
        },
        `veo ${shot.id}`,
        10 * 60 * 1000
      );
      const vurl = r?.video?.url || r?.video_url || r?.videos?.[0]?.url;
      if (!vurl) throw new Error(`no video url ${JSON.stringify(r).slice(0, 180)}`);
      await writeFile(dest, Buffer.from(await (await fetch(vurl)).arrayBuffer()));
      log(`clip ${shot.id}: done`);
      return dest;
    } catch (e) {
      log(`clip ${shot.id}: attempt ${attempt} failed — ${e.message}`);
      if (attempt === 2) throw e;
      await sleep(6000);
    }
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(items[i], i);
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

// 16:9 Veo clip → 2.39 letterbox on a 1920×1080 canvas + grain/vignette; strip Veo audio.
async function normalize(clipPath, dest) {
  await ff([
    '-i',
    clipPath,
    '-vf',
    'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,crop=1920:804:0:138,pad=1920:1080:0:138:color=black,setsar=1,fps=30,vignette=angle=PI/5,noise=alls=2:allf=t+u,format=yuv420p',
    '-an',
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'medium',
    dest
  ]);
}

// Hard-cut concat (motivated cuts, not a crossfade montage).
async function concatReel(norms, dest) {
  const inputs = norms.flatMap(n => ['-i', n]);
  const labels = norms.map((_, i) => `[${i}:v]`).join('');
  await ff([
    ...inputs,
    '-filter_complex',
    `${labels}concat=n=${norms.length}:v=1:a=0[v]`,
    '-map',
    '[v]',
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    dest
  ]);
  let total = 0;
  for (const n of norms) total += await probeDuration(n);
  return total;
}

async function score(reel, reelDur, dest) {
  const audio = path.join(ROOT, AUDIO_REL);
  const fadeOut = Math.max(0, reelDur - 1.5).toFixed(2);
  await ff([
    '-i',
    reel,
    '-i',
    audio,
    '-filter_complex',
    `[1:a]atrim=0:${reelDur.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOut}:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
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
  for (const d of [REF, FRAMES, CLIPS, NORM, OUT]) await mkdir(d, { recursive: true });
  const m = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : m.shots.length;
  const shots = m.shots.slice(0, limit);
  const isPreview = shots.length < m.shots.length || m.shots.length <= 3;
  log(
    `${m.id}: ${shots.length}/${m.shots.length} shots ${isPreview ? '(PREVIEW)' : '(FULL)'} · Veo 3.1 via Fal`
  );

  let clips;
  if (process.env.STITCH_ONLY) {
    clips = shots.map(s => path.join(CLIPS, `${s.id}.mp4`));
    for (const c of clips) if (!existsSync(c)) throw new Error(`STITCH_ONLY but missing ${c}`);
  } else {
    const tok = await token();
    // Hero reference still — the canonical lead, reused for identity continuity.
    const lead = m.characters?.[0];
    const heroFrame = lead
      ? await flux(
          tok,
          `${lead.description} Full-body hero portrait, standing resolute, bronze scale-mail, one notched sword, rain and distant firelight, cinematic key light`,
          path.join(REF, 'hero.jpg'),
          'hero'
        )
      : null;
    log(`generating ${shots.length} Veo 3.1 clips (8s, 1080p, audio off), concurrency ${CONCURRENCY}…`);
    clips = await pool(shots, CONCURRENCY, shot => veoClip(tok, shot, heroFrame));
  }

  log(`normalizing ${clips.length} clips → 2.39 letterbox…`);
  const norms = [];
  for (let i = 0; i < clips.length; i++) {
    const n = path.join(NORM, `${shots[i].id}.mp4`);
    await normalize(clips[i], n);
    norms.push(n);
  }

  const reel = path.join(OUT, `${FILM_ID}.reel.mp4`);
  log('concatenating (hard cuts)…');
  const reelDur = await concatReel(norms, reel);

  const suffix = isPreview ? '_PREVIEW' : '';
  const final = path.join(OUT, `${FILM_ID}${suffix}.mp4`);
  log(`scoring (${reelDur.toFixed(1)}s of the track)…`);
  await score(reel, reelDur, final);
  await copyFile(final, path.join(FILM_DIR, `preview.mp4`));
  const deskDest = path.join(HOME, 'Desktop', `${FILM_ID}${suffix}.mp4`);
  await copyFile(final, deskDest);
  const sz = (await stat(final)).size;
  log(
    `✅ ${FILM_ID}${suffix} → ${path.relative(ROOT, final)} + ${path.relative(ROOT, path.join(FILM_DIR, 'preview.mp4'))} + ~/Desktop/${FILM_ID}${suffix}.mp4 (${(sz / 1e6).toFixed(1)} MB, ${reelDur.toFixed(1)}s)`
  );
}

run().catch(e => {
  console.error('\n[veo-film] FAILED:', e.message);
  process.exit(1);
});
