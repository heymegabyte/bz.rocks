import { describe, it, expect } from 'vitest';
import { vizShouldYield } from './visualizer';

// The visualizer skips its heavy draw() for a short window right after a user
// interaction so the browser can paint the interaction's result unimpeded —
// field + lab data showed INP on bz.rocks is ~100% PRESENTATION delay (the
// canvas render competes for the paint frame), not processing. This helper is
// the pure decision; the class wires pointer/key events to it. Guarding the
// boundary + the "no interaction yet" case keeps the ambient viz from ever
// freezing at startup.
describe('vizShouldYield', () => {
  it('never yields before any interaction (last <= 0)', () => {
    expect(vizShouldYield(1000, 0, 100)).toBe(false);
    expect(vizShouldYield(1000, -5, 100)).toBe(false);
  });

  it('yields inside the window (recent interaction)', () => {
    expect(vizShouldYield(1000, 950, 100)).toBe(true); // 50ms ago
    expect(vizShouldYield(1000, 999, 100)).toBe(true); // 1ms ago
    expect(vizShouldYield(1000, 1000, 100)).toBe(true); // same instant
  });

  it('does not yield once the window has elapsed', () => {
    expect(vizShouldYield(1000, 850, 100)).toBe(false); // 150ms ago
    expect(vizShouldYield(1000, 900, 100)).toBe(false); // exactly 100ms → not < 100
  });

  it('is a one-shot gate — a single tap yields only for the window, not forever', () => {
    const tap = 500;
    expect(vizShouldYield(560, tap, 100)).toBe(true); // 60ms after tap
    expect(vizShouldYield(650, tap, 100)).toBe(false); // 150ms after tap → resumed
  });
});
