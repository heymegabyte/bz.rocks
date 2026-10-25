import { test, expect, type APIRequestContext } from '@playwright/test';

// The DJ chat runs on Cloudflare Workers AI (Llama) ONLY — never Claude/OpenAI.
// The settings drawer offers two REAL Workers AI models; the worker allowlists
// them and IGNORES any other/bogus model string (a legacy "claude-*" value, an
// injected fake) rather than silently fall back to 8B while labelling the reply
// as something it never ran. The non-stream response echoes the model ACTUALLY
// used. This guards the "never fake a model/capability in the UI" mandate.
// Runs against PROD_URL.
const BASE = process.env.PROD_URL || 'https://bz.rocks';
const REAL = ['@cf/meta/llama-3.1-8b-instruct-fp8', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'];

async function chat(request: APIRequestContext, model: string) {
  return request.post(`${BASE}/api/ai/chat`, {
    data: {
      messages: [{ role: 'user', content: 'Say hi in three words.' }],
      model,
      stream: false,
      max_tokens: 32,
      temperature: 0.5
    }
  });
}

test.describe('AI chat model honesty (/api/ai/chat)', () => {
  test('a bogus/claude model is ignored; response echoes a REAL Workers AI model', async ({
    request
  }) => {
    for (const fake of ['claude-opus-4-7', 'claude-haiku-4-5-20251001', 'totally-fake-model-xyz-999']) {
      const res = await chat(request, fake);
      expect(res.status(), fake).toBe(200);
      const body = (await res.json()) as { text?: string; model?: string };
      expect(typeof body.text).toBe('string');
      expect(body.text!.length).toBeGreaterThan(0);
      // Never echo the fake — the model must be one of the real Workers AI models.
      expect(REAL, `fake "${fake}" was echoed instead of a real model`).toContain(body.model);
    }
  });

  test('a real Workers AI model is honored (or honestly downgraded, never faked)', async ({
    request
  }) => {
    const res = await chat(request, REAL[1]); // request 70B deep
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { model?: string };
    // 70B when healthy, or an honest 8B downgrade on a transient 70B outage —
    // either way a real Workers AI model, never a fabricated label.
    expect(REAL).toContain(body.model);
  });
});
