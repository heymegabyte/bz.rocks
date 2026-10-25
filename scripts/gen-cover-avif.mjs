// Generate AVIF variants of every /art cover JPEG so the Worker can content-
// negotiate (serve AVIF to browsers that Accept it, JPEG otherwise) — ~52%
// smaller with no visible quality loss, zero markup changes. Runs in prebuild:
// a new cover JPEG with no AVIF sibling gets one automatically. Existing AVIF are
// left alone (they're committed) — set FORCE=1 to regenerate all (e.g. after
// updating a cover image or changing the quality setting).
import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'public/art';
const force = process.env.FORCE === '1';
const jpgs = readdirSync(dir).filter(f => /\.jpe?g$/i.test(f));
let srcTotal = 0,
  avifTotal = 0,
  made = 0,
  skipped = 0;
for (const f of jpgs) {
  const src = join(dir, f);
  const out = join(dir, f.replace(/\.jpe?g$/i, '.avif'));
  if (!force && existsSync(out)) {
    skipped++;
    continue;
  }
  // quality 52 + effort 4: visually lossless for cover art, strong compression.
  await sharp(src).avif({ quality: 52, effort: 4 }).toFile(out);
  srcTotal += statSync(src).size;
  avifTotal += statSync(out).size;
  made++;
}
if (made) {
  const pct = Math.round((1 - avifTotal / srcTotal) * 100);
  console.log(
    `gen-cover-avif: ${made} new AVIF (${Math.round(srcTotal / 1024)}→${Math.round(avifTotal / 1024)} KB, ${pct}% smaller), ${skipped} already present`
  );
} else {
  console.log(`gen-cover-avif: all ${skipped} covers already have AVIF (FORCE=1 to regenerate)`);
}
