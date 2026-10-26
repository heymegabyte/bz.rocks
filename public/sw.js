// scripts/inject-sw-assets.mjs (post `vite build`) rewrites these two lines with
// the current hashed entry assets + a content hash, so a deploy that changes the
// bundle busts the cache AND precaches the new critical render path — the app
// renders fully offline + loads instantly from cache on the very first return
// visit, not just after a runtime-cache warmup. Safe defaults if the injector
// hasn't run (dev): no build assets, static version.
const BUILD_HASH = 'dev';
const BUILD_ASSETS = [];

const VERSION = `panda-desiiignare-v3-${BUILD_HASH}`;
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const AUDIO_CACHE = `${VERSION}-audio`;
const IMAGE_CACHE = `${VERSION}-image`;
// Persistent offline-download cache for explicitly-saved tracks (#49). NOT
// version-prefixed, so it SURVIVES service-worker updates — the activate handler
// below preserves it by name while wiping every other (versioned) cache on each
// deploy. Written by the client (src/offline-audio.ts); served Range-aware here.
const OFFLINE_AUDIO_CACHE = 'bz-offline-audio';

const PRECACHE = [
  '/',
  '/ashton.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  ...BUILD_ASSETS
];

// Self-contained offline fallback. Served INLINE (not from a cached file) so it
// has zero fetch/URL dependency — previously the SW precached '/offline.html',
// but CF Assets redirects /offline.html → /offline and the worker soft-404s the
// extensionless /offline, so the entry could never be cached and (via addAll)
// killed the ENTIRE service-worker install. Branded, reduced-motion-safe, no
// external assets, works with no network.
const OFFLINE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · bZ</title><style>:root{color-scheme:dark}*{margin:0;box-sizing:border-box}body{min-height:100svh;display:grid;place-items:center;background:#060610;color:#f4f4ff;font-family:'Space Grotesk',system-ui,sans-serif;text-align:center;padding:2rem;overflow:hidden}.wrap{max-width:30rem;position:relative;z-index:1}.mark{font-family:'Sora',system-ui,sans-serif;font-weight:900;font-size:3.2rem;letter-spacing:-.03em;background:linear-gradient(135deg,#00E5FF,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:1rem}h1{font-size:1.5rem;font-weight:800;margin-bottom:.75rem}p{color:#a8a8c0;line-height:1.55;margin-bottom:1.75rem}button{font:inherit;font-weight:700;color:#060610;background:#00E5FF;border:0;border-radius:999px;padding:.72rem 1.7rem;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;box-shadow:0 8px 30px -8px #00E5FF}button:hover{transform:translateY(-2px);box-shadow:0 14px 42px -8px #00E5FF}.pulse{position:fixed;inset:0;background:radial-gradient(circle at 50% 42%,rgba(0,229,255,.14),transparent 60%);animation:breathe 6s ease-in-out infinite;z-index:0}@keyframes breathe{0%,100%{opacity:.35}50%{opacity:.9}}@media(prefers-reduced-motion:reduce){.pulse{animation:none}button{transition:none}}</style></head><body><div class="pulse" aria-hidden="true"></div><div class="wrap"><div class="mark">bZ</div><h1>You're offline</h1><p>The signal dropped — but the music's still here. Reconnect and press play.</p><button type="button" onclick="location.reload()">Try again</button></div></body></html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async cache => {
      // Individual adds (NOT addAll) so one failing/redirecting entry never
      // rejects the whole install — addAll is all-or-nothing, and a single
      // 404/redirect previously killed the entire SW (no caching, no offline).
      await Promise.allSettled(PRECACHE.map(u => cache.add(u)));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => !k.startsWith(VERSION) && k !== OFFLINE_AUDIO_CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isAudio(url) {
  return url.pathname.startsWith('/audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(url.pathname);
}
function isImage(url) {
  return url.pathname.startsWith('/art/') || /\.(png|jpe?g|webp|avif|svg|gif)$/i.test(url.pathname);
}
function isHTML(req) {
  return req.headers.get('accept')?.includes('text/html');
}

// The Cache API rejects partial (206) + opaque responses — audio range
// requests return 206, which previously threw "Failed to execute 'put' on
// 'Cache': Partial response (status code 206) is unsupported" and surfaced as
// an uncaught promise rejection. Only cache full, OK, same-origin responses.
function isCacheable(request, response) {
  return (
    !!response &&
    response.ok &&
    response.status === 200 &&
    request.method === 'GET' &&
    response.type !== 'opaque' &&
    response.type !== 'opaqueredirect'
  );
}

async function safePut(cache, request, response) {
  if (!isCacheable(request, response)) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    /* range/partial/quota — skip silently, never reject the fetch */
  }
}

async function networkFirst(request, cacheName, timeoutMs = 3000) {
  const cache = await caches.open(cacheName);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))
    ]);
    await safePut(cache, request, network);
    return network;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (isHTML(request)) return offlineResponse();
    throw new Error('offline');
  }
}

async function cacheFirst(request, cacheName, maxEntries = 60) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  await safePut(cache, request, network);
  trimCache(cacheName, maxEntries);
  return network;
}

// Serve a full cached response while honoring an HTTP Range request (#49). The
// <audio> element streams via Range, so a 200 full body cached offline must be
// sliced into a 206 Partial — otherwise seeking/streaming misbehaves. No Range
// header → return the full body. Supports normal, open-ended, and suffix ranges.
async function serveRange(request, cached) {
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) return cached.clone();
  const buf = await cached.clone().arrayBuffer();
  const total = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m) return cached.clone();
  let start = m[1] === '' ? NaN : parseInt(m[1], 10);
  let end = m[2] === '' ? NaN : parseInt(m[2], 10);
  if (Number.isNaN(start)) {
    if (Number.isNaN(end)) return cached.clone();
    start = Math.max(0, total - end); // suffix range: bytes=-N
    end = total - 1;
  } else if (Number.isNaN(end)) {
    end = total - 1;
  }
  end = Math.min(end, total - 1);
  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}`, 'Accept-Ranges': 'bytes' }
    });
  }
  const chunk = buf.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('content-type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': String(chunk.byteLength),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}

// Audio strategy (#49): a DOWNLOADED track is served Range-aware from the
// persistent offline cache (works online AND offline, instant). Everything else
// streams from the network exactly as before — this is purely additive, so
// non-downloaded playback is unchanged. Offline + not-downloaded surfaces the
// browser's normal media network error (nothing to serve).
async function audioOffline(request) {
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return serveRange(request, cached);
  } catch {
    /* fall through to network */
  }
  return fetch(request);
}

async function staleWhileRevalidate(request, cacheName, maxEntries = 80) {
  const cache = await caches.open(cacheName);
  // Check this cache first, then ALL caches — the precached critical JS/CSS live
  // in the SHELL cache, so an offline asset request must find them there too,
  // else the shell loads from cache but its bundle can't and the SPA renders
  // blank offline.
  const cached = (await cache.match(request)) || (await caches.match(request));
  const networkPromise = fetch(request)
    .then(async res => {
      await safePut(cache, request, res);
      trimCache(cacheName, maxEntries);
      return res;
    })
    .catch(() => null);
  // Images never fall back to the HTML offline page — a failed/uncached image
  // returns a clean network error (broken <img>), not an HTML document.
  return cached || (await networkPromise) || Response.error();
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (const key of keys.slice(0, keys.length - maxEntries)) await cache.delete(key);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname === '/health' || url.pathname.startsWith('/api/')) return;

  if (isAudio(url)) return event.respondWith(audioOffline(req));
  if (isImage(url)) return event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE, 80));
  if (isHTML(req) || url.pathname === '/' || url.pathname.endsWith('.html'))
    return event.respondWith(networkFirst(req, SHELL_CACHE));
  if (/\.(css|js|woff2?|ttf|json)$/i.test(url.pathname))
    return event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, 60));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'bZ', body: event.data?.text() || 'Tap to listen.' };
  }
  const title = data.title || 'bZ — new drop';
  const body = data.body || 'Tap to listen.';
  const url = data.url || '/';
  const icon = data.icon || '/art/icon-192.png';
  const badge = data.badge || '/art/icon-192.png';
  const image = data.image;
  const tag = data.tag || 'bz-broadcast';
  const options = {
    body,
    icon,
    badge,
    tag,
    image,
    data: { url },
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Listen' },
      { action: 'dismiss', title: 'Later' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const target = event.notification.data?.url || '/';
  const absolute = new URL(target, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin)) {
          c.focus();
          return c.navigate(absolute).catch(() => null);
        }
      }
      return self.clients.openWindow(absolute);
    })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    (async () => {
      const reg = self.registration;
      const oldSub = event.oldSubscription;
      const appServerKey = oldSub?.options?.applicationServerKey;
      if (!appServerKey) return;
      try {
        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSub.toJSON())
        });
      } catch {
        /* user revoked or service unavailable */
      }
    })()
  );
});
