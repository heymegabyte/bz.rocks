#!/usr/bin/env node
// Listmonk campaign + optional Web Push for a new track drop.
//
//   node scripts/drop-broadcast.mjs <track-id> [--dry] [--push] [--from "bZ <hi@megabyte.space>"]
//
// Env: LISTMONK_URL, LISTMONK_API_USER, LISTMONK_API_TOKEN, [LISTMONK_LIST_NAME],
//      [LISTMONK_FROM_EMAIL], [PUSH_ADMIN_URL], [PUSH_ADMIN_TOKEN]
//
// Reads src/data.ts via tsc-free dynamic import (uses pre-built dist if present, else parses raw).

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITE_ORIGIN = 'https://bz.rocks';
const DEFAULT_LIST_NAME = 'bz.rocks';
const DEFAULT_FROM = process.env.LISTMONK_FROM_EMAIL || 'bZ <hi@megabyte.space>';

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const positional = args.filter(a => !a.startsWith('--'));
const trackId = positional[0];
const fromOverride = (() => {
  const i = args.indexOf('--from');
  return i > -1 ? args[i + 1] : null;
})();

if (!trackId || flags.has('--help')) {
  console.log('Usage: node scripts/drop-broadcast.mjs <track-id> [--dry] [--push] [--from "Name <email>"]');
  process.exit(trackId ? 0 : 1);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const LISTMONK_URL = requireEnv('LISTMONK_URL').replace(/\/+$/, '');
const LISTMONK_API_USER = requireEnv('LISTMONK_API_USER');
const LISTMONK_API_TOKEN = requireEnv('LISTMONK_API_TOKEN');
const LISTMONK_LIST_NAME = process.env.LISTMONK_LIST_NAME || DEFAULT_LIST_NAME;

function lmHeaders() {
  return {
    Authorization: `token ${LISTMONK_API_USER}:${LISTMONK_API_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'bz.rocks/drop-broadcast'
  };
}

async function lmFetch(path, init = {}) {
  const r = await fetch(`${LISTMONK_URL}${path}`, {
    ...init,
    headers: { ...lmHeaders(), ...(init.headers || {}) }
  });
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!r.ok) throw new Error(`Listmonk ${r.status} ${path}: ${text.slice(0, 300)}`);
  return json;
}

// Tiny .ts loader — extract ALBUMS + TRACKS const-literal blocks and eval as JS.
async function loadTracks() {
  const src = await readFile(resolve(ROOT, 'src/data.ts'), 'utf8');
  const grab = name => {
    const re = new RegExp(`export const ${name}\\s*:\\s*[A-Za-z\\[\\]]+\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);`);
    const m = src.match(re);
    if (!m) throw new Error(`Could not extract ${name} from data.ts`);
    return m[1];
  };
  // Parse top-level COVERS map separately (used inside TRACKS).
  const coversMatch = src.match(/const COVERS\s*=\s*(\{[\s\S]*?\n\});/);
  if (!coversMatch) throw new Error('Could not extract COVERS from data.ts');
  const js = `const COVERS = ${coversMatch[1]};\nexport const ALBUMS = ${grab('ALBUMS')};\nexport const TRACKS = ${grab('TRACKS')};`;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  const mod = await import(dataUrl);
  return { tracks: mod.TRACKS, albums: mod.ALBUMS };
}

const { tracks, albums } = await loadTracks();
const track = tracks.find(t => t.id === trackId);
if (!track) {
  console.error(`Unknown track: ${trackId}`);
  console.error('Available:', tracks.map(t => t.id).join(', '));
  process.exit(1);
}
const album = albums.find(a => a.id === track.album);
const trackUrl = `${SITE_ORIGIN}/${track.album}/${track.id}`;
const ogImage = `${SITE_ORIGIN}/og/track-${track.id}.jpg`;

// Resolve the drop list (matches the worker's logic).
async function resolveListId() {
  const search = await lmFetch(`/api/lists?query=${encodeURIComponent(LISTMONK_LIST_NAME)}&per_page=100`);
  const results = search?.data?.results || [];
  const match = results.find(l => l.name === LISTMONK_LIST_NAME) || results[0];
  if (match?.id) return match.id;
  throw new Error(`Listmonk list not found: ${LISTMONK_LIST_NAME}`);
}

const subject = `${track.title} — new drop · bZ`;
const previewText = track.vibe.charAt(0).toUpperCase() + track.vibe.slice(1);
const lyricPreview = track.lyrics
  .slice(0, 4)
  .map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  .map(l => `<p style="margin:0 0 4px">${l}</p>`)
  .join('');
const html = `<!doctype html>
<html lang="en" style="margin:0;padding:0"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/><meta name="supported-color-schemes" content="dark"/>
<title>new drop — ${track.title}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%}a{text-decoration:none}
img{border:0;line-height:100%;outline:none;-ms-interpolation-mode:bicubic}
@media only screen and (max-width:620px){.card{width:100%!important;border-radius:0!important;border-left:0!important;border-right:0!important}.pad{padding-left:24px!important;padding-right:24px!important}.h1{font-size:36px!important}}
</style></head>
<body style="margin:0;padding:0;background-color:#050509;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">New drop: ${track.title} — ${previewText}. Press play.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#050509;background-image:radial-gradient(1100px 520px at 50% -8%,#10112a 0%,#090913 45%,#050509 100%)">
<tr><td align="center" style="padding:40px 12px">
<table role="presentation" class="card" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#0a0a16;border:1px solid rgba(0,229,255,0.28);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(6,6,20,0.6)">
<tr><td height="5" style="height:5px;font-size:0;line-height:0;background-color:#00e5ff;background-image:linear-gradient(90deg,#00e5ff 0%,#50aae3 28%,#7c3aed 62%,#34f5c5 100%)">&nbsp;</td></tr>
<tr><td class="pad" style="padding:26px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td align="left" valign="middle"><a href="${SITE_ORIGIN}" style="text-decoration:none;color:#ffffff"><img src="${SITE_ORIGIN}/art/bz-app-icon-192.png?v=4" alt="bZ" width="40" height="40" style="display:inline-block;vertical-align:middle;border-radius:10px;border:1px solid rgba(0,229,255,0.35)"/><span style="display:inline-block;vertical-align:middle;margin-left:12px;font-family:'Sora',system-ui,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.01em;color:#ffffff">bZ</span></a></td>
<td align="right" valign="middle" style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:rgba(236,238,255,0.45)">new&nbsp;drop</td></tr></table></td></tr>
<tr><td class="pad" style="padding:24px 40px 0"><a href="${trackUrl}" style="text-decoration:none"><img src="${ogImage}" alt="${track.title} — bZ" width="520" style="display:block;width:100%;max-width:520px;height:auto;border-radius:14px;border:1px solid rgba(0,229,255,0.22)"/></a></td></tr>
<tr><td class="pad" style="padding:24px 40px 0"><div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:#00e5ff">new drop · ${album?.name || 'bZ'}</div><h1 class="h1" style="margin:12px 0 0;font-family:'Sora',system-ui,sans-serif;font-size:40px;font-weight:900;color:#ffffff;line-height:1;letter-spacing:-0.03em">${track.title}</h1></td></tr>
<tr><td class="pad" style="padding:16px 40px 0;font-size:16px;line-height:1.62;color:rgba(236,238,255,0.88)"><p style="margin:0"><em style="color:#c4b5fd;font-style:normal">${previewText}.</em></p></td></tr>
<tr><td class="pad" style="padding:18px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(124,92,246,0.08);border-left:3px solid #7c3aed;border-radius:12px"><tr><td style="padding:16px 18px;font-family:'Sora',system-ui,sans-serif;font-style:italic;font-size:15px;line-height:1.5;color:#ffffff">${lyricPreview}</td></tr></table></td></tr>
<tr><td class="pad" align="left" style="padding:24px 40px 0">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${trackUrl}" style="height:50px;v-text-anchor:middle;width:200px" arcsize="100%" fillcolor="#00E5FF" stroke="f"><center style="color:#04060f;font-family:sans-serif;font-size:16px;font-weight:bold">&#9654;&nbsp; Press play</center></v:roundrect><![endif]-->
<!--[if !mso]><!-- --><a href="${trackUrl}" style="display:inline-block;font-family:'Sora',system-ui,sans-serif;font-weight:700;font-size:16px;color:#04060f;background-color:#00e5ff;background-image:linear-gradient(135deg,#00e5ff 0%,#4fd1ff 52%,#50aae3 100%);padding:15px 30px;border-radius:999px;box-shadow:0 10px 30px rgba(0,229,255,0.32)">&#9654;&nbsp; Press play</a><!--<![endif]--></td></tr>
<tr><td class="pad" style="padding:26px 40px 0"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(124,92,246,0.1);border:1px solid rgba(124,92,246,0.26);border-radius:14px"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.55;color:rgba(236,238,255,0.78)">Reply and tell me if it hits — or which line did. <em style="color:#c4b5fd;font-style:normal">hey@megabyte.space</em> reaches me, not a queue.</td></tr></table></td></tr>
<tr><td class="pad" style="padding:30px 40px 0"><div style="height:1px;background-image:linear-gradient(90deg,rgba(0,229,255,0.5),rgba(124,92,246,0.3),rgba(255,255,255,0))">&nbsp;</div></td></tr>
<tr><td class="pad" style="padding:22px 40px 34px">
<div style="font-family:'Sora',system-ui,sans-serif;font-size:15px;font-weight:800;color:#ffffff">bZ</div>
<div style="margin:3px 0 14px;font-size:13px;line-height:1.5;color:rgba(236,238,255,0.5)">Hard but holy. Hustle gospel out of Newark, NJ.</div>
<div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.04em;color:rgba(236,238,255,0.6)"><a href="${SITE_ORIGIN}" style="color:#00e5ff;text-decoration:none">listen</a> &nbsp;·&nbsp; <a href="${SITE_ORIGIN}/stats" style="color:#00e5ff;text-decoration:none">stats</a> &nbsp;·&nbsp; <a href="${SITE_ORIGIN}/merch" style="color:#00e5ff;text-decoration:none">merch</a></div>
<div style="margin-top:16px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;line-height:1.6;letter-spacing:0.02em;color:rgba(236,238,255,0.4)">First listen, every drop. No ads, no spam.<br/><a href="{{ UnsubscribeURL }}" style="color:rgba(236,238,255,0.6);text-decoration:underline">unsubscribe</a> &nbsp;·&nbsp; <a href="mailto:hey@megabyte.space" style="color:rgba(236,238,255,0.6);text-decoration:underline">hey@megabyte.space</a></div>
</td></tr></table>
<table role="presentation" class="card" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px"><tr><td align="center" style="padding:18px 0 0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(236,238,255,0.26)">bz.rocks</td></tr></table>
</td></tr></table>
</body></html>`;

const listId = await resolveListId();
console.log(`✓ Listmonk list "${LISTMONK_LIST_NAME}" id=${listId}`);
console.log(`  Track: ${track.title} (${track.id}) — ${trackUrl}`);

if (flags.has('--dry')) {
  console.log('--- DRY RUN ---');
  console.log(`Subject: ${subject}`);
  console.log(`From:    ${fromOverride || DEFAULT_FROM}`);
  console.log(`HTML:    ${html.length} bytes`);
  console.log(`OG:      ${ogImage}`);
  if (flags.has('--push')) console.log('Push:    would POST /api/push/send');
  process.exit(0);
}

const created = await lmFetch('/api/campaigns', {
  method: 'POST',
  body: JSON.stringify({
    name: `drop:${track.id}:${new Date().toISOString().slice(0, 10)}`,
    subject,
    lists: [listId],
    from_email: fromOverride || DEFAULT_FROM,
    content_type: 'html',
    body: html,
    type: 'regular',
    tags: ['drop', track.album, track.id],
    altbody: `${track.title} — ${album?.name || 'bZ'}\nListen: ${trackUrl}\n\nUnsubscribe: {{ UnsubscribeURL }}`
  })
});
const campaignId = created?.data?.id;
if (!campaignId) throw new Error('Campaign create returned no id');
console.log(`✓ Campaign #${campaignId} created.`);

await lmFetch(`/api/campaigns/${campaignId}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'running' })
});
console.log(`✓ Campaign #${campaignId} sending. Watch ${LISTMONK_URL}/admin/campaigns/${campaignId}`);

if (flags.has('--push')) {
  const pushUrl = process.env.PUSH_ADMIN_URL || `${SITE_ORIGIN}/api/push/send`;
  const pushTok = process.env.PUSH_ADMIN_TOKEN;
  if (!pushTok) {
    console.warn('! --push set but PUSH_ADMIN_TOKEN missing — skipping push');
  } else {
    const r = await fetch(pushUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pushTok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${track.title} — bZ`,
        body: previewText,
        url: trackUrl,
        image: ogImage,
        tag: `drop:${track.id}`,
        trackId: track.id
      })
    });
    const text = await r.text();
    console.log(`✓ Push fan-out: ${r.status} ${text.slice(0, 200)}`);
  }
}
