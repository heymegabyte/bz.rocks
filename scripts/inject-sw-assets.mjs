// Post-build: inject the current hashed CRITICAL-PATH assets (+ a content hash
// for cache-busting) into dist/sw.js, so the service worker precaches the app's
// render path. Result: the app renders fully offline + loads instantly from
// cache on the first return visit, and each deploy that changes the bundle busts
// the SW cache cleanly (the content hash → a new VERSION → old caches cleared on
// activate). Runs after `vite build`; modifies dist/sw.js only (public/sw.js keeps
// its safe 'dev' defaults). Idempotent.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = 'dist/index.html';
const sw = 'dist/sw.js';
if (!existsSync(html) || !existsSync(sw)) {
  console.log('inject-sw-assets: dist/index.html or dist/sw.js missing — skipped');
  process.exit(0);
}

const indexHtml = readFileSync(html, 'utf8');
// Critical render path only: every /assets/*.{js,css} the shell references
// directly (main entry + modulepreloaded chunks + stylesheets). Lazy chunks
// (ai-chat, merch-cart, cast receiver…) are NOT here — they stay runtime-cached,
// loaded on demand, so the precache stays lean.
const assets = [
  ...new Set([...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(m => m[1]))
];

if (!assets.length) {
  console.log('inject-sw-assets: no /assets refs found in index.html — left SW at defaults');
  process.exit(0);
}

const hash = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 10);

const swCode = readFileSync(sw, 'utf8')
  .replace(/const BUILD_HASH = '[^']*';/, `const BUILD_HASH = '${hash}';`)
  .replace(/const BUILD_ASSETS = \[[^\]]*\];/, `const BUILD_ASSETS = ${JSON.stringify(assets)};`);
writeFileSync(sw, swCode);
console.log(`inject-sw-assets: precaching ${assets.length} critical assets, cache hash ${hash}`);
