// Offline audio downloads (#49)
// ─────────────────────────────────────────────────────────────────────────────
// Explicitly-downloaded tracks are stored as full MP3s in a cache that SURVIVES
// service-worker updates (the SW's activate handler deletes every cache NOT named
// exactly this). The service worker (public/sw.js) serves them back Range-aware
// from this same cache, so a downloaded track plays with zero network — and
// instantly even when online. Everything here is OPT-IN + ADDITIVE: a track that
// hasn't been downloaded streams from the network exactly as before.
//
// Why a deliberate download instead of passively caching playback: the audio
// element streams via Range requests, which return 206 Partial responses, and
// the Cache API cannot store a 206 — so played tracks never cached on their own.
// A plain fetch (no Range) returns the full 200 body we can persist.

const OFFLINE_AUDIO_CACHE = 'bz-offline-audio';

function supported(): boolean {
  return typeof caches !== 'undefined';
}

/** True if the given audio URL has a complete offline copy stored. */
export async function isDownloaded(url: string): Promise<boolean> {
  if (!supported()) return false;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    return !!(await cache.match(url, { ignoreVary: true }));
  } catch {
    return false;
  }
}

/**
 * Fetch the FULL file (no Range → 200) and persist a clean 200 response keyed by
 * the URL, so the service worker can slice Range requests out of it offline.
 * Returns true on success. Fail-soft: any error returns false (never throws).
 */
export async function downloadForOffline(url: string): Promise<boolean> {
  if (!supported()) return false;
  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) return false;
    const body = await resp.blob();
    // An MP3 is comfortably > 10KB — a tiny body means an error/partial page,
    // never a real track, so refuse to store it (would break offline playback).
    if (body.size < 10_000) return false;
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    await cache.put(
      url,
      new Response(body, {
        status: 200,
        headers: {
          'Content-Type': resp.headers.get('content-type') || 'audio/mpeg',
          'Content-Length': String(body.size),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Remove a track's offline copy. Fail-soft. */
export async function removeDownload(url: string): Promise<void> {
  if (!supported()) return;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    await cache.delete(url, { ignoreVary: true });
  } catch {
    /* ignore */
  }
}

/** Count + total bytes of downloaded tracks (for a storage summary). Fail-soft. */
export async function offlineUsage(): Promise<{ count: number; bytes: number }> {
  if (!supported()) return { count: 0, bytes: 0 };
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const keys = await cache.keys();
    let bytes = 0;
    for (const req of keys) {
      const res = await cache.match(req);
      const len = Number(res?.headers.get('content-length') || 0);
      if (len) bytes += len;
    }
    return { count: keys.length, bytes };
  } catch {
    return { count: 0, bytes: 0 };
  }
}

/** List every downloaded track: its URL + stored byte length. Fail-soft → []. */
export async function listOfflineDownloads(): Promise<Array<{ url: string; bytes: number }>> {
  if (!supported()) return [];
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const keys = await cache.keys();
    const out: Array<{ url: string; bytes: number }> = [];
    for (const req of keys) {
      const res = await cache.match(req);
      out.push({ url: req.url, bytes: Number(res?.headers.get('content-length') || 0) });
    }
    return out;
  } catch {
    return [];
  }
}

/** Remove ALL offline downloads at once (drops the whole cache). Fail-soft. */
export async function clearAllOffline(): Promise<void> {
  if (!supported()) return;
  try {
    await caches.delete(OFFLINE_AUDIO_CACHE);
  } catch {
    /* ignore */
  }
}

/**
 * Download several tracks for offline (e.g. a whole album). Sequential so we never
 * hammer the worker with parallel full-file fetches. Skips already-downloaded URLs.
 * Reports progress after each. Fail-soft per track — one failure doesn't abort the rest.
 */
export async function downloadMany(
  urls: string[],
  onProgress?: (done: number, total: number, ok: number) => void
): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;
  const total = urls.length;
  for (let i = 0; i < total; i++) {
    const url = urls[i]!;
    const already = await isDownloaded(url);
    const done = already || (await downloadForOffline(url));
    if (done) ok++;
    else fail++;
    onProgress?.(i + 1, total, ok);
  }
  return { ok, fail };
}
