import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {InkArrowProbe} from '../tests/scenes/ink-arrow-motion.probe';
import {openScene} from './helpers/render';
describe('native ink arrow', () => {
  let page: Page;
  let probe: InkArrowProbe;
  beforeAll(async () => {
    page = await openScene('ink-arrow-motion');
    probe = await page.evaluate(async () => {
      if (!window.inkArrowProbe) {
        throw new Error('Missing arrow probe.');
      }
      return window.inkArrowProbe;
    });
  });
  afterAll(async () => {
    await page?.close();
  });
  test('draws the shaft before the two arrowhead strokes', () => {
    expect(probe.samples.some(s => s.progress > 0 && s.progress < 1)).toBe(
      true,
    );
    expect(probe.samples.some(s => s.head > 0 && s.head < 0.5)).toBe(true);
    expect(probe.samples.some(s => s.head > 0.5 && s.head < 1)).toBe(true);
    expect(probe.samples.every(s => s.head === 0 || s.progress === 1)).toBe(
      true,
    );
  });
  test('holds stop-motion poses and supports cancellation and zero-duration replay', () => {
    expect(
      probe.samples.some(
        (s, i) =>
          i > 0 &&
          s.progress > 0 &&
          s.progress < 1 &&
          s.progress === probe.samples[i - 1].progress,
      ),
    ).toBe(true);
    expect(probe.cancelled).toBe(true);
    expect(probe.zeroDuration).toBe(true);
  });
  test('preserves local endpoints and independent seeded clones, including zero-length arrows', () => {
    expect(probe.endpoints).toBe(true);
    expect(probe.clamped).toBe(true);
    expect(probe.independent).toBe(true);
    expect(probe.zeroLength).toBe(true);
  });
});
