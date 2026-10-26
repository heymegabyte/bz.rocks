// bZ Music — MCP server (#3 "bZ in chat"): ships the catalog's UI + tools INTO
// ChatGPT / Claude via the Model Context Protocol (Streamable HTTP + MCP Apps,
// SEP-1865). A listener in an AI client can search bZ's catalog, get grounded
// recommendations, and see a PLAYABLE track-card widget — the product lives where
// the listener already is, not only on bz.rocks.
//
// Design contract:
//  - GROUNDED: every tool answers ONLY from the real catalog (TRACKS/ALBUMS).
//    Deterministic keyword/tag/album matching — no model call, so it's free + fast
//    even when a host calls it on every turn, and it can NEVER hallucinate a track.
//  - DUAL-FIELD (graceful degradation — the #1 MCP-Apps rule): every tool returns
//    BOTH a text `content` block (what any model reads/speaks) AND `structuredContent`
//    (what the ui:// widget renders). Half the clients never render the widget — the
//    text must stand alone.
//  - READ-ONLY + PUBLIC: no mutations, only public catalog data → no auth needed,
//    CORS open. (A mutating tool would require OAuth + a consent gate.)
import { TRACKS, ALBUMS, TRACK_BY_ID, ALBUM_BY_ID } from '../src/data';

const SITE = 'https://bz.rocks';
// The protocol version we implement (stable MCP rev). Hosts negotiate; we echo
// back a version we support rather than blindly mirroring the client's.
const PROTOCOL_VERSION = '2025-06-18';
const WIDGET_URI = 'ui://bz/tracks.html';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization',
  'Access-Control-Max-Age': '86400'
};

interface TrackCard {
  id: string;
  title: string;
  album: string;
  albumId: string;
  vibe: string;
  url: string;
  embedUrl: string;
  cover: string;
  reason?: string;
}

function cardFor(trackId: string, reason?: string): TrackCard | null {
  const t = TRACK_BY_ID.get(trackId);
  if (!t) return null;
  const album = ALBUM_BY_ID.get(t.album);
  return {
    id: t.id,
    title: t.title,
    album: album?.name ?? 'bZ',
    albumId: album?.id ?? '',
    vibe: t.vibe,
    url: `${SITE}/${album?.id ?? ''}/${t.id}`,
    embedUrl: `${SITE}/embed/${t.id}`,
    cover: `${SITE}${album?.cover ?? '/art/logo.png'}`,
    ...(reason ? { reason } : {})
  };
}

/** Deterministic grounded search over title + vibe + album name. Scored so an
 * exact title hit ranks above an incidental vibe-word match. */
function searchCatalog(query: string, limit = 8): TrackCard[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const scored = TRACKS.map(t => {
    const album = ALBUM_BY_ID.get(t.album);
    const hay = `${t.title} ${t.vibe} ${album?.name ?? ''}`.toLowerCase();
    let score = 0;
    if (t.title.toLowerCase() === q) score += 100;
    if (t.title.toLowerCase().includes(q)) score += 40;
    if ((album?.name ?? '').toLowerCase().includes(q)) score += 15;
    for (const w of words) if (hay.includes(w)) score += 3;
    return { t, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(x => cardFor(x.t.id)).filter((c): c is TrackCard => !!c);
}

/** Grounded recommendations: same-album mates first, then shared-vibe-word
 * tracks across the catalog. Excludes the seed. Every pick carries a concrete
 * `reason` so the result reads as a real "more like this", not a flat list. */
function recommend(seedId: string, limit = 6): TrackCard[] {
  const seed = TRACK_BY_ID.get(seedId);
  if (!seed) return [];
  const seedAlbum = ALBUM_BY_ID.get(seed.album);
  const seedWords = new Set(seed.vibe.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const out: TrackCard[] = [];
  const seen = new Set<string>([seedId]);
  for (const id of seedAlbum?.trackIds ?? []) {
    if (seen.has(id) || out.length >= limit) continue;
    const c = cardFor(id, `From the same album, ${seedAlbum?.name}`);
    if (c) {
      out.push(c);
      seen.add(id);
    }
  }
  if (out.length < limit) {
    const scored = TRACKS.filter(t => !seen.has(t.id))
      .map(t => {
        const shared = [...new Set(t.vibe.toLowerCase().split(/\s+/))].filter(w => seedWords.has(w));
        return { t, shared };
      })
      .filter(x => x.shared.length > 0)
      .sort((a, b) => b.shared.length - a.shared.length)
      .slice(0, limit - out.length);
    for (const { t, shared } of scored) {
      const c = cardFor(t.id, `Shares the ${shared.slice(0, 2).join(' / ')} mood`);
      if (c) out.push(c);
    }
  }
  return out;
}

function albumCards(albumId: string): { album: string; tagline: string; tracks: TrackCard[] } | null {
  const album = ALBUM_BY_ID.get(albumId);
  if (!album) return null;
  return {
    album: album.name,
    tagline: album.tagline,
    tracks: album.trackIds.map(id => cardFor(id)).filter((c): c is TrackCard => !!c)
  };
}

function tracksToText(intro: string, cards: TrackCard[]): string {
  if (!cards.length) return `${intro} (no matching tracks in bZ's catalog).`;
  const lines = cards.map(
    c => `• ${c.title} — ${c.album}${c.reason ? ` (${c.reason})` : ''}: ${c.url}`
  );
  return `${intro}\n${lines.join('\n')}\n\nEvery link plays in-browser on bz.rocks.`;
}

// --- JSON-RPC plumbing ------------------------------------------------------
type Id = string | number | null;
function rpcResult(id: Id, result: unknown): Response {
  return Response.json({ jsonrpc: '2.0', id, result }, { headers: CORS });
}
function rpcError(id: Id, code: number, message: string): Response {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } }, { headers: CORS });
}

const TOOLS = [
  {
    name: 'search_catalog',
    title: "Search bZ's music",
    description:
      "Search bZ's catalog by title, mood/vibe, or album. Returns real, playable tracks — never invent a track that isn't returned here.",
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'A title, mood, vibe, or album name' } },
      required: ['query']
    },
    _meta: {
      'openai/outputTemplate': WIDGET_URI,
      'openai/toolInvocation/invoking': "Searching bZ's catalog…",
      'openai/toolInvocation/invoked': 'Found tracks'
    }
  },
  {
    name: 'recommend_tracks',
    title: 'Recommend similar bZ tracks',
    description:
      'Given a bZ track id (from search_catalog), return grounded "more like this" picks with a reason for each.',
    inputSchema: {
      type: 'object',
      properties: { trackId: { type: 'string', description: 'A track id returned by search_catalog' } },
      required: ['trackId']
    },
    _meta: {
      'openai/outputTemplate': WIDGET_URI,
      'openai/toolInvocation/invoking': 'Finding more like it…',
      'openai/toolInvocation/invoked': 'Here are similar tracks'
    }
  },
  {
    name: 'get_album',
    title: 'Get a bZ album tracklist',
    description: "List all tracks on a bZ album by album id (e.g. 'desiiignare', 'canon').",
    inputSchema: {
      type: 'object',
      properties: { albumId: { type: 'string', description: 'An album id' } },
      required: ['albumId']
    },
    _meta: { 'openai/outputTemplate': WIDGET_URI }
  }
];

function toolCall(name: string, args: Record<string, unknown>): unknown {
  if (name === 'search_catalog') {
    const cards = searchCatalog(String(args.query ?? ''));
    return {
      content: [{ type: 'text', text: tracksToText(`bZ tracks matching "${String(args.query ?? '')}":`, cards) }],
      structuredContent: { tracks: cards },
      _meta: { 'openai/outputTemplate': WIDGET_URI }
    };
  }
  if (name === 'recommend_tracks') {
    const cards = recommend(String(args.trackId ?? ''));
    const seed = TRACK_BY_ID.get(String(args.trackId ?? ''));
    const intro = seed ? `More bZ tracks like "${seed.title}":` : 'Similar bZ tracks:';
    return {
      content: [{ type: 'text', text: tracksToText(intro, cards) }],
      structuredContent: { tracks: cards },
      _meta: { 'openai/outputTemplate': WIDGET_URI }
    };
  }
  if (name === 'get_album') {
    const a = albumCards(String(args.albumId ?? ''));
    if (!a) {
      return {
        content: [{ type: 'text', text: `No bZ album with id "${String(args.albumId ?? '')}".` }],
        isError: true
      };
    }
    return {
      content: [{ type: 'text', text: tracksToText(`${a.album} — ${a.tagline}:`, a.tracks) }],
      structuredContent: { album: a.album, tagline: a.tagline, tracks: a.tracks },
      _meta: { 'openai/outputTemplate': WIDGET_URI }
    };
  }
  return null;
}

// Self-contained sandboxed widget (MCP Apps). Reads window.openai.toolOutput
// (OpenAI Apps SDK) or the injected structuredContent; renders grounded track
// cards that open the real in-browser player on bz.rocks. No external deps.
const WIDGET_HTML = `<!doctype html><html><head><meta charset="utf-8" />
<style>
  :root{color-scheme:dark}
  body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#060610;color:#f4f4ff}
  .wrap{display:flex;flex-direction:column;gap:8px;padding:10px}
  .card{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.03);text-decoration:none;color:inherit}
  .card:hover{border-color:#00E5FF}
  .card img{width:48px;height:48px;border-radius:8px;object-fit:cover;flex:0 0 auto}
  .meta{min-width:0;flex:1}
  .t{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .s{font-size:.8rem;color:#a0a0c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .play{flex:0 0 auto;color:#00E5FF;font-weight:800;font-size:1.1rem}
  .empty{color:#a0a0c0;padding:12px;text-align:center}
</style></head><body><div class="wrap" id="w"></div>
<script>
  function data(){try{return (window.openai&&window.openai.toolOutput)||window.__MCP_OUTPUT__||{}}catch(e){return {}}}
  function render(){
    var d=data(),tracks=(d&&d.tracks)||[],w=document.getElementById('w');
    if(!tracks.length){w.innerHTML='<div class="empty">No tracks.</div>';return}
    w.innerHTML='';
    tracks.forEach(function(t){
      var a=document.createElement('a');a.className='card';a.href=t.url;a.target='_blank';a.rel='noopener';
      var img=document.createElement('img');img.src=t.cover;img.alt='';a.appendChild(img);
      var m=document.createElement('div');m.className='meta';
      var ti=document.createElement('div');ti.className='t';ti.textContent=t.title;m.appendChild(ti);
      var su=document.createElement('div');su.className='s';su.textContent=(t.reason?t.reason:t.album+' · '+t.vibe);m.appendChild(su);
      a.appendChild(m);
      var p=document.createElement('div');p.className='play';p.textContent='▶';a.appendChild(p);
      w.appendChild(a);
    });
  }
  render();
  window.addEventListener('message',render);
</script></body></html>`;

export async function handleMcp(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  // A human / discovery GET → a small descriptor (not an SSE stream; we're stateless).
  if (request.method === 'GET') {
    return Response.json(
      {
        name: 'bZ Music MCP',
        description: "Search + explore bZ's music catalog from inside an AI client.",
        protocol: 'mcp',
        protocolVersion: PROTOCOL_VERSION,
        transport: 'streamable-http',
        endpoint: `${SITE}/mcp`,
        tools: TOOLS.map(t => t.name)
      },
      { headers: CORS }
    );
  }
  if (request.method !== 'POST') return rpcError(null, -32600, 'Method not allowed');

  let msg: { jsonrpc?: string; id?: Id; method?: string; params?: Record<string, unknown> };
  try {
    msg = (await request.json()) as typeof msg;
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }
  const id = (msg.id ?? null) as Id;
  const method = msg.method ?? '';
  const params = msg.params ?? {};

  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'bZ Music', version: '1.0.0' },
        instructions:
          "bZ is a hustle-gospel artist. Use search_catalog to find real tracks, recommend_tracks for more-like-this, get_album for a tracklist. Only reference tracks these tools return — never invent one."
      });
    // Notifications carry no id and expect no response body.
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return new Response(null, { status: 202, headers: CORS });
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS });
    case 'tools/call': {
      const name = String(params.name ?? '');
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      const result = toolCall(name, args);
      if (result === null) return rpcError(id, -32602, `Unknown tool: ${name}`);
      return rpcResult(id, result);
    }
    case 'resources/list':
      return rpcResult(id, {
        resources: [
          {
            uri: WIDGET_URI,
            name: 'bZ track cards',
            description: 'Playable track-card list rendered from a tool result.',
            mimeType: 'text/html+skybridge'
          }
        ]
      });
    case 'resources/read': {
      const uri = String(params.uri ?? '');
      if (uri !== WIDGET_URI) return rpcError(id, -32602, `Unknown resource: ${uri}`);
      return rpcResult(id, {
        contents: [{ uri: WIDGET_URI, mimeType: 'text/html+skybridge', text: WIDGET_HTML }]
      });
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
