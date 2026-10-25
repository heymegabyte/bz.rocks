import { test, expect } from '@playwright/test';

// GET /api/vitals aggregates RUM Web Vitals from KV. On a low-traffic site the window
// can go HOURS with no new beacon, so the aggregate describes OLD sessions — and without
// a freshness signal that stale data reads as "now" and misleads CWV decisions (a real
// near-miss: the field data looked frozen across fires; it was just 14h-stale from no
// overnight traffic, not a broken pipeline). This guards the freshness fields so staleness
// is always visible. Runs on PROD.

test.describe('/api/vitals — freshness signal', () => {
  test('exposes fresh + freshness so stale field data is never read as current', async ({
    request
  }) => {
    const res = await request.get('/api/vitals');
    expect(res.ok()).toBeTruthy();
    const d = (await res.json()) as {
      fresh?: unknown;
      freshness?: { newestAgeMin: number | null; oldestAgeMin: number | null; samples: number };
      note?: string;
      samples?: number;
    };

    // The freshness contract: a boolean `fresh` + a `freshness` block with ages.
    expect(typeof d.fresh).toBe('boolean');
    expect(d.freshness, 'freshness block present').toBeTruthy();
    expect(typeof d.freshness!.samples).toBe('number');
    // Ages are a number (minutes) or null (when there are zero timestamped samples).
    const { newestAgeMin, oldestAgeMin } = d.freshness!;
    expect(newestAgeMin === null || typeof newestAgeMin === 'number').toBeTruthy();
    expect(oldestAgeMin === null || typeof oldestAgeMin === 'number').toBeTruthy();

    // Internal consistency: oldest is at least as old as newest.
    if (typeof newestAgeMin === 'number' && typeof oldestAgeMin === 'number') {
      expect(oldestAgeMin).toBeGreaterThanOrEqual(newestAgeMin);
    }

    // The `fresh` boolean must agree with the age (fresh ⇒ a beacon within 2h), and a
    // STALE window must SAY so in the note (so a reader can't miss it).
    if (d.fresh === true) {
      expect(typeof newestAgeMin).toBe('number');
      expect(newestAgeMin as number).toBeLessThanOrEqual(120);
    } else {
      expect(d.note ?? '').toMatch(/stale/i);
    }
  });
});
