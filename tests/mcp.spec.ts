import { test, expect } from '@playwright/test';

// MCP server (#3 "bZ in chat") — JSON-RPC over Streamable HTTP at /mcp.
// Pure protocol surface, so these drive it via the request fixture (no browser).
// Guards: the handshake, the tool list, GROUNDED tool results (a real track +
// real URL, dual-field text + structuredContent), the ui:// widget resource, and
// CORS (hosts like ChatGPT/Claude call cross-origin).
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const MCP = `${BASE}/mcp`;

async function rpc(request: import('@playwright/test').APIRequestContext, method: string, params?: unknown, id = 1) {
  const res = await request.post(MCP, {
    headers: { 'Content-Type': 'application/json' },
    data: { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) }
  });
  return res;
}

test.describe('MCP server (/mcp)', () => {
  test('initialize returns protocol + serverInfo + capabilities', async ({ request }) => {
    const body = await (await rpc(request, 'initialize', {})).json();
    expect(body.result.protocolVersion).toBeTruthy();
    expect(body.result.serverInfo.name).toBe('bZ Music');
    expect(Object.keys(body.result.capabilities)).toContain('tools');
    expect(body.result.instructions).toContain('never invent');
  });

  test('tools/list exposes the grounded catalog tools with a ui output template', async ({ request }) => {
    const body = await (await rpc(request, 'tools/list')).json();
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(expect.arrayContaining(['search_catalog', 'recommend_tracks', 'get_album']));
    const search = body.result.tools.find((t: { name: string }) => t.name === 'search_catalog');
    expect(search._meta['openai/outputTemplate']).toBe('ui://bz/tracks.html');
    expect(search.inputSchema.required).toContain('query');
  });

  test('search_catalog returns GROUNDED, dual-field results (text + real tracks + real URLs)', async ({
    request
  }) => {
    const body = await (await rpc(request, 'tools/call', {
      name: 'search_catalog',
      arguments: { query: 'mercy' }
    })).json();
    const r = body.result;
    // Dual-field: a text block any model can read AND structured data for the widget.
    expect(r.content[0].type).toBe('text');
    expect(r.content[0].text.length).toBeGreaterThan(10);
    const tracks = r.structuredContent.tracks as Array<{ title: string; url: string; id: string }>;
    expect(tracks.length).toBeGreaterThan(0);
    // Grounded: every URL is a real bz.rocks track URL (never a hallucinated path).
    for (const t of tracks) {
      expect(t.url.startsWith(`${BASE}/`)).toBe(true);
      expect(t.id.length).toBeGreaterThan(0);
    }
  });

  test('recommend_tracks is grounded off a real seed with reasons', async ({ request }) => {
    const search = await (await rpc(request, 'tools/call', {
      name: 'search_catalog',
      arguments: { query: 'mercy' }
    })).json();
    const seed = search.result.structuredContent.tracks[0].id as string;
    const body = await (await rpc(request, 'tools/call', { name: 'recommend_tracks', arguments: { trackId: seed } })).json();
    const recs = body.result.structuredContent.tracks as Array<{ id: string; reason?: string }>;
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every(r => r.id !== seed)).toBe(true); // never recommends the seed itself
    expect(recs[0].reason && recs[0].reason.length).toBeTruthy();
  });

  test('resources/read serves the sandboxed ui:// widget', async ({ request }) => {
    const body = await (await rpc(request, 'resources/read', { uri: 'ui://bz/tracks.html' })).json();
    const c = body.result.contents[0];
    expect(c.mimeType).toContain('text/html');
    // The widget is DATA-DRIVEN — real track URLs flow in from the tool output at
    // render time (window.openai.toolOutput), so the static HTML carries the render
    // logic, not hardcoded URLs. Assert the Apps-SDK bridge + the card renderer.
    expect(c.text).toContain('window.openai'); // reads the Apps-SDK tool output
    expect(c.text).toContain('toolOutput');
    expect(c.text).toContain('createElement'); // DOM-builds the playable track cards
  });

  test('unknown tool + unknown method return JSON-RPC errors; CORS preflight ok', async ({ request }) => {
    const bad = await (await rpc(request, 'tools/call', { name: 'nope', arguments: {} })).json();
    expect(bad.error.code).toBe(-32602);
    const nomethod = await (await rpc(request, 'does/not/exist')).json();
    expect(nomethod.error.code).toBe(-32601);
    const pre = await request.fetch(MCP, { method: 'OPTIONS' });
    expect(pre.status()).toBe(204);
    expect(pre.headers()['access-control-allow-origin']).toBe('*');
  });
});
