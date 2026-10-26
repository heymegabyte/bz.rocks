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
import { detectBeats } from './detect-beats.mjs';

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
const T2V_MODEL = 'fal-ai/veo3.1'; // Veo 3.1 text-to-video — most photoreal path (no stylized keyframe)
const T2V = process.env.T2V === '1'; // T2V=1 → pure Veo text-to-video (max realism); else image-to-video
const MINIMAX = process.env.MINIMAX === '1'; // MINIMAX=1 → native MiniMax Hailuo-02 via Brian's subscription key (cap-compliant $0.25/s)
const MINIMAX_MODEL = 'MiniMax-Hailuo-02';
const MINIMAX_BASE = 'https://api.minimax.io/v1';
const MINIMAX_FAL = process.env.MINIMAX_FAL === '1'; // MINIMAX_FAL=1 → SAME MiniMax Hailuo-02 model, but billed via Fal (when the native token plan is exhausted; keeps the lead consistent with native-MiniMax clips)
const MINIMAX_FAL_MODEL = 'fal-ai/minimax/hailuo-02/pro/text-to-video'; // 1080p, 6s t2v
const SEEDANCE = process.env.SEEDANCE === '1'; // SEEDANCE=1 → ByteDance Seedance 2.5 via Fal (top-tier model, 4-30s, 720p native)
const SEEDANCE_MODEL = 'bytedance/seedance-2.5/text-to-video';
const SEEDANCE_REF_MODEL = 'bytedance/seedance-2.5/reference-to-video'; // character consistency via a hero reference pack
const BEATCUT = process.env.BEATCUT === '1'; // BEATCUT=1 → cut on the song's beats (music-video edit)
const CONCURRENCY = 3;
const AUDIO_REL = `public/audio/${FILM_ID}.mp3`;

// Shared keyframe look (the standing brief: hyper-real, HBO, no overlays).
const STYLE =
  ' — hyper-realistic, HBO-level cinematic, anamorphic 35mm, teal-and-amber color grade, volumetric light, fine film grain, ultra-detailed, dignified, no text, no watermark, no overlays.';

// Photoreal directive appended to EVERY Veo prompt — the look must be
// indistinguishable from real live-action footage, never a CGI/game render.
const PHOTOREAL =
  ' Shot on ARRI Alexa 65 with vintage anamorphic lenses, real 35mm photochemical film grain, photojournalistic realism; REAL practical fire and REAL smoke with true combustion physics, natural skin with pores and sweat, true-to-life lighting and physics — 100% photoreal, indistinguishable from real live-action footage.';
const NEG =
  'CGI, 3D render, Unreal Engine, video game, game cinematic, cartoon, anime, illustration, painting, concept art, digital art, plastic skin, waxy skin, airbrushed, mannequin, doll, fake fire, gas-jet flames, floating embers everywhere, stylized, oversaturated, overexposed, uncanny, deformed, extra limbs, watermark, text';

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

async function veoClip(tok, shot, heroFrame, heroPack) {
  const dest = path.join(CLIPS, `${shot.id}.mp4`);
  if (existsSync(dest) && (await stat(dest)).size > 100_000) {
    log(`clip ${shot.id}: cached ✓`);
    return dest;
  }
  const prompt = shot.veoPrompt + PHOTOREAL;
  const negative_prompt = [NEG, shot.negativePrompt].filter(Boolean).join(', ');
  // Seedance 2.5 (top-tier, no keyframe) · Veo T2V · or Veo image-to-video from a photoreal keyframe.
  let model, input;
  if (MINIMAX_FAL) {
    // SAME Hailuo-02 model as the native rail, via Fal billing — consistent look, no negative_prompt param.
    model = MINIMAX_FAL_MODEL;
    input = { prompt, prompt_optimizer: true };
  } else if (SEEDANCE) {
    if (shot.seedanceRef && heroPack && heroPack.length) {
      // reference-to-video: lock the lead's exact face + armor to the hero pack across every shot
      model = SEEDANCE_REF_MODEL;
      input = {
        prompt: `Keep the SAME warrior as @Image1 — his exact face, beard, and battered bronze scale armor, unchanged. ${prompt}`,
        image_urls: heroPack,
        resolution: '720p',
        duration: 8,
        aspect_ratio: '16:9',
        generate_audio: false
      };
    } else {
      model = SEEDANCE_MODEL;
      input = { prompt, resolution: '720p', duration: 8, aspect_ratio: '16:9', generate_audio: false };
    }
  } else if (T2V) {
    model = T2V_MODEL;
    input = {
      prompt,
      aspect_ratio: '16:9',
      duration: '8s',
      resolution: '1080p',
      generate_audio: false,
      negative_prompt
    };
  } else {
    const frame =
      shot.useHeroAsFirstFrame && heroFrame
        ? heroFrame
        : await flux(tok, shot.keyframePrompt, path.join(FRAMES, `${shot.id}.jpg`), `kf ${shot.id}`);
    model = I2V_MODEL;
    input = {
      prompt,
      image_url: await dataUri(frame),
      duration: '8s',
      resolution: '1080p',
      aspect_ratio: '16:9',
      generate_audio: false,
      negative_prompt
    };
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await falRun(tok, model, input, `gen ${shot.id}`, (SEEDANCE ? 20 : 10) * 60 * 1000);
      const vurl = r?.video?.url || r?.video_url || r?.videos?.[0]?.url;
      if (!vurl) throw new Error(`no video url ${JSON.stringify(r).slice(0, 180)}`);
      await writeFile(dest, Buffer.from(await (await fetch(vurl)).arrayBuffer()));
      log(`clip ${shot.id}: done`);
      return dest;
    } catch (e) {
      log(`clip ${shot.id}: attempt ${attempt} failed — ${e.message}`);
      if (attempt === 2) throw e;
      if (SEEDANCE && model === SEEDANCE_REF_MODEL) {
        log(`clip ${shot.id}: ref→t2v fallback`);
        model = SEEDANCE_MODEL;
        input = { prompt, resolution: '720p', duration: 8, aspect_ratio: '16:9', generate_audio: false };
      }
      await sleep(6000);
    }
  }
}

// Native MiniMax subscription key — env first, then repo-local .dev.vars (gitignored).
async function minimaxToken() {
  if (process.env.MINIMAX_API_KEY) return process.env.MINIMAX_API_KEY.trim();
  try {
    const dv = await readFile(path.join(ROOT, '.dev.vars'), 'utf8');
    const m = dv.match(/^MINIMAX_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    /* no .dev.vars */
  }
  throw new Error('MINIMAX_API_KEY not available (env or .dev.vars)');
}

// MiniMax Hailuo-02 text-to-video: submit → poll task → retrieve file → download.
// 1080P = 6s clips; no negative_prompt param (prompt_optimizer handles quality).
async function minimaxClip(tok, shot) {
  const dest = path.join(CLIPS, `${shot.id}.mp4`);
  if (existsSync(dest) && (await stat(dest)).size > 100_000) {
    log(`clip ${shot.id}: cached ✓`);
    return dest;
  }
  const H = { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' };
  const prompt = shot.veoPrompt + PHOTOREAL;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const sub = await (
        await fetch(`${MINIMAX_BASE}/video_generation`, {
          method: 'POST',
          headers: H,
          body: JSON.stringify({
            model: MINIMAX_MODEL,
            prompt,
            duration: 6,
            resolution: '1080P',
            prompt_optimizer: true
          })
        })
      ).json();
      const taskId = sub?.task_id;
      if (!taskId) throw new Error(`submit: ${JSON.stringify(sub?.base_resp || sub).slice(0, 200)}`);
      let fileId;
      const t0 = Date.now();
      for (;;) {
        if (Date.now() - t0 > 12 * 60 * 1000) throw new Error('poll timeout');
        await sleep(6000);
        const st = await (
          await fetch(`${MINIMAX_BASE}/query/video_generation?task_id=${taskId}`, { headers: H })
        ).json();
        if (st?.status === 'Success') {
          fileId = st.file_id;
          break;
        }
        if (st?.status === 'Fail')
          throw new Error(`gen failed: ${JSON.stringify(st?.base_resp || st).slice(0, 200)}`);
      }
      const fr = await (
        await fetch(`${MINIMAX_BASE}/files/retrieve?file_id=${fileId}`, { headers: H })
      ).json();
      const url = fr?.file?.download_url;
      if (!url) throw new Error(`retrieve: ${JSON.stringify(fr?.base_resp || fr).slice(0, 200)}`);
      await writeFile(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
      log(`clip ${shot.id}: done`);
      return dest;
    } catch (e) {
      log(`clip ${shot.id}: attempt ${attempt} failed — ${e.message}`);
      if (attempt === 2) throw e;
      await sleep(8000);
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

// Hero reference pack — stills of the lead from several angles; Seedance reference-to-video
// anchors every hero shot to these so the face + armor stay consistent across the whole film.
async function makeHeroPack(tok, lead) {
  if (!lead) return null;
  const angles = [
    'head-and-shoulders portrait, facing camera, neutral grey background',
    'three-quarter profile, determined',
    'full-body stance, sword lowered, ready'
  ];
  const pack = [];
  for (let i = 0; i < angles.length; i++) {
    const dest = path.join(REF, `hero-${i}.jpg`);
    await flux(tok, `${lead.description} ${angles[i]}, rain-damp, cinematic key light`, dest, `heroref-${i}`);
    pack.push(await dataUri(dest));
  }
  log(`hero pack ready (${pack.length} refs) — locking the character across shots`);
  return pack;
}

// Beat-synced edit: cut ON the song's beats, cycling a reusable shot POOL to fill the track.
// Shots BREATHE — each holds a MINIMUM in SECONDS (robust to a double-time beat grid), snapped to
// the nearest beat >= that hold; a climax window cuts faster. "Less rapid in general, except
// sometimes" (Brian 2026-10-25). Tune via BEAT_MIN_HOLD / BEAT_PEAK_HOLD / BEAT_PEAK_FROM.
async function beatCutReel(norms, beats, songDur, dest) {
  const MIN_HOLD = parseFloat(process.env.BEAT_MIN_HOLD || '3.0'); // calm default hold (s)
  const PEAK_HOLD = parseFloat(process.env.BEAT_PEAK_HOLD || '1.5'); // rapid, in the peak only (s)
  const PEAK_FROM = parseFloat(process.env.BEAT_PEAK_FROM || '0.78'); // song fraction where the rapid climax starts
  const poolDur = [];
  for (const n of norms) poolDur.push(await probeDuration(n));
  const segs = [];
  let bi = 0,
    t = 0,
    idx = 0;
  while (t < songDur - 0.1 && beats.length) {
    // Hold each shot >= `hold` seconds (longer by default, faster only at the climax),
    // snapping the cut to the nearest beat so it still lands ON a beat.
    const hold = t >= songDur * PEAK_FROM ? PEAK_HOLD : MIN_HOLD;
    let nb = bi;
    while (nb < beats.length && beats[nb] - (beats[bi] ?? t) < hold) nb++;
    if (nb >= beats.length) nb = beats.length - 1;
    let len = (beats[nb] ?? songDur) - (beats[bi] ?? t);
    if (!(len > 0.3)) len = hold;
    len = Math.min(len, songDur - t);
    const ci = idx % norms.length;
    const room = Math.max(0.1, poolDur[ci] - len - 0.05);
    segs.push({ clip: norms[ci], inPoint: +((idx * 1.9) % room).toFixed(2), len: +len.toFixed(2) });
    t += len;
    idx++;
    bi = nb + 1;
    if (bi >= beats.length) {
      bi = beats.findIndex(b => b > t);
      if (bi < 0) bi = 0;
    }
  }
  const segFiles = [];
  for (let i = 0; i < segs.length; i++) {
    const f = path.join(NORM, `seg-${String(i).padStart(4, '0')}.mp4`);
    await ff([
      '-ss',
      String(segs[i].inPoint),
      '-i',
      segs[i].clip,
      '-t',
      String(segs[i].len),
      '-an',
      '-c:v',
      'libx264',
      '-crf',
      '18',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      f
    ]);
    segFiles.push(f);
  }
  const listFile = path.join(OUT, 'beatlist.txt');
  await writeFile(listFile, segFiles.map(f => `file '${f}'`).join('\n'));
  await ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', dest]);
  log(`beat-cut: ${segs.length} cuts on beats → ${t.toFixed(1)}s`);
  return t;
}

async function run() {
  for (const d of [REF, FRAMES, CLIPS, NORM, OUT]) await mkdir(d, { recursive: true });
  const m = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : m.shots.length;
  const pick = process.env.SHOTS ? process.env.SHOTS.split(',').map(s => s.trim()) : null;
  const shots = pick
    ? pick.map(id => m.shots.find(s => s.id === id)).filter(Boolean)
    : m.shots.slice(0, limit);
  const isFull = process.env.FULL === '1'; // default = preview; set FULL=1 for the full-length film
  log(
    `${m.id}: ${shots.length}/${m.shots.length} shots ${isFull ? '(FULL)' : '(PREVIEW)'} · ${MINIMAX ? 'MiniMax Hailuo-02 (subscription)' : SEEDANCE ? 'Seedance 2.5 via Fal' : T2V ? 'Veo 3.1 t2v via Fal' : 'Veo 3.1 i2v via Fal'}`
  );

  let clips;
  if (process.env.STITCH_ONLY) {
    clips = shots.map(s => path.join(CLIPS, `${s.id}.mp4`));
    for (const c of clips) if (!existsSync(c)) throw new Error(`STITCH_ONLY but missing ${c}`);
  } else if (MINIMAX) {
    const tok = await minimaxToken();
    log(
      `generating ${shots.length} MiniMax Hailuo-02 clips (6s, 1080P) on your subscription, concurrency 4…`
    );
    clips = await pool(shots, 4, shot => minimaxClip(tok, shot));
  } else {
    const tok = await token();
    // Hero reference still — i2v identity continuity only; skipped in T2V (no keyframe).
    const lead = m.characters?.[0];
    const heroFrame =
      !T2V && !SEEDANCE && !MINIMAX_FAL && lead
        ? await flux(
            tok,
            `${lead.description} Full-body hero portrait, standing resolute, bronze scale-mail, one notched sword, rain and distant firelight, cinematic key light`,
            path.join(REF, 'hero.jpg'),
            'hero'
          )
        : null;
    const heroPack =
      SEEDANCE && shots.some(s => s.seedanceRef) ? await makeHeroPack(tok, m.characters?.[0]) : null;
    log(
      `generating ${shots.length} ${MINIMAX_FAL ? 'MiniMax Hailuo-02 via Fal (6s, 1080p)' : SEEDANCE ? 'Seedance 2.5 (8s, 720p)' : `Veo 3.1 ${T2V ? 'text-to-video' : 'image-to-video'} (8s, 1080p)`} clips, audio off, concurrency ${CONCURRENCY}…`
    );
    clips = await pool(shots, CONCURRENCY, shot => veoClip(tok, shot, heroFrame, heroPack));
  }

  log(`normalizing ${clips.length} clips → 2.39 letterbox…`);
  const norms = [];
  for (let i = 0; i < clips.length; i++) {
    const n = path.join(NORM, `${shots[i].id}.mp4`);
    await normalize(clips[i], n);
    norms.push(n);
  }

  const reel = path.join(OUT, `${FILM_ID}.reel.mp4`);
  let reelDur;
  if (BEATCUT) {
    const { beats, duration, src } = await detectBeats(path.join(ROOT, AUDIO_REL));
    log(`beat-cut: ${beats.length} beats (${src}), cutting ${norms.length} pool clips to the beat…`);
    reelDur = await beatCutReel(norms, beats, duration, reel);
  } else {
    log('concatenating (hard cuts)…');
    reelDur = await concatReel(norms, reel);
  }

  const suffix = isFull ? '' : '_PREVIEW';
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
