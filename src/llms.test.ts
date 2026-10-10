import { describe, it, expect } from 'vitest';
import { buildLlmsTxt } from './llms';

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt('https://bz.rocks');

  it('starts with a single H1 title (llmstxt.org requirement)', () => {
    expect(txt.startsWith('# ')).toBe(true);
    expect((txt.match(/^# /gm) || []).length).toBe(1);
  });

  it('contains markdown links (Lighthouse agentic-browsing requirement)', () => {
    const links = txt.match(/\[[^\]]+\]\(https:\/\/bz\.rocks\/[^)]*\)/g) || [];
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it('lists albums + the feed + key pages', () => {
    expect(txt).toContain('## Albums');
    expect(txt).toContain('/feed.xml');
    expect(txt).toContain('/about');
  });
});
