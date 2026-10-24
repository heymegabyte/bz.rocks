#!/usr/bin/env node
// Generate the 3 new-album covers via Ideogram v3 (OpenAI image gen is dead for
// this estate — see memory reference-asset-and-email-rails). Downloads the
// ephemeral URL immediately, resizes to a 1024² JPEG into public/art/.
//   IDEOGRAM_API_KEY=$(get-secret IDEOGRAM_API_KEY) node scripts/nexty-gen-covers.mjs
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KEY =
  process.env.IDEOGRAM_API_KEY ||
  (() => {
    try {
      return execFileSync('/Users/Apple/.local/bin/get-secret', ['IDEOGRAM_API_KEY'], {
        encoding: 'utf8'
      }).trim();
    } catch {
      return '';
    }
  })();
if (!KEY) {
  console.error('IDEOGRAM_API_KEY missing');
  process.exit(1);
}

const OUT = path.join(process.cwd(), 'public', 'art');
const BRAND = 'Palette: deep midnight #060610, electric cyan #00E5FF, violet #7C3AED.';
const BASE =
  'Album cover art, perfect square 1:1 composition, cinematic HBO-grade color, ' +
  'volumetric light, 35mm film grain, premium gallery print, hyper-detailed, anti-AI-slop, no watermark. ';

const COVERS = [
  {
    file: 'cover-wake-up-alice.jpg',
    prompt:
      BASE +
      'A luminous young woman with flowing dark hair stands before a cracked antique mirror inside a stark ' +
      'white psychiatric ward that dissolves into a cosmic looking-glass; the mirror reflects a deep starfield ' +
      'and the faint silhouette of a white rabbit made of light. A paper-cup moon and a fluorescent sun hang ' +
      'overhead. Cold periwinkle-blue and electric-cyan light, surreal wonderland-noir. Elegant neon-cyan title ' +
      'text "WAKE UP, ALICE" across the top, small "bZ" beneath. Periwinkle #7AA2FF accents. ' +
      BRAND
  },
  {
    file: 'cover-the-pause.jpg',
    prompt:
      BASE +
      'A single calm figure seated in meditation on perfectly still water at dawn, soft concentric ripples ' +
      'spreading out, a thin ribbon of light entering the frame like a held breath, distant misty mountains, ' +
      'one bright morning star in a lavender-and-cyan sky. Minimalist, spacious, tranquil, serene. ' +
      'Clean elegant title text "THE PAUSE" centered, small "bZ" beneath. Soft lavender #B49CFF accents. ' +
      BRAND
  },
  {
    file: 'cover-little-lanterns.jpg',
    prompt:
      BASE +
      'Dozens of glowing warm paper lanterns rise into a night sky above a great ancient tree (a mercy tree); ' +
      'diverse multicultural hands lift lanterns from below; a small child holds the brightest lantern. Warm ' +
      'amber-gold lantern glow mingles with cyan starlight. Tender, hopeful, luminous, gospel warmth. ' +
      'Hand-lettered title text "LITTLE LANTERNS" arcing across the top, small "bZ" beneath. ' +
      'Warm amber #FFAE57 and gold #F5C24A accents. ' +
      BRAND
  }
];

async function gen(spec) {
  if (existsSync(path.join(OUT, spec.file))) {
    console.log(`[${spec.file}] exists — skip`);
    return true;
  }
  const t0 = Date.now();
  const form = new FormData();
  form.set('prompt', spec.prompt);
  form.set('aspect_ratio', '1x1');
  form.set('rendering_speed', 'QUALITY');
  form.set('num_images', '1');
  form.set('magic_prompt', 'OFF');
  form.set('style_type', 'REALISTIC');
  const res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: { 'Api-Key': KEY },
    body: form
  });
  if (!res.ok) {
    console.error(`[${spec.file}] ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return false;
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) {
    console.error(`[${spec.file}] no url in response: ${JSON.stringify(data).slice(0, 200)}`);
    return false;
  }
  const img = Buffer.from(await (await fetch(url)).arrayBuffer());
  const jpg = await sharp(img)
    .resize(1024, 1024, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 90 })
    .toBuffer();
  await writeFile(path.join(OUT, spec.file), jpg);
  console.log(`[${spec.file}] ok ${(jpg.length / 1024) | 0}KB in ${Date.now() - t0}ms`);
  return true;
}

const results = [];
for (const spec of COVERS) results.push(await gen(spec)); // sequential — gentle on the API
console.log(`Done: ${results.filter(Boolean).length}/${COVERS.length} covers`);
process.exit(results.every(Boolean) ? 0 : 1);
