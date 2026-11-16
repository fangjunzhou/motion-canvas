import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {ChartMotionProbe} from '../tests/scenes/chart-motion.probe';
import {openScene} from './helpers/render';

describe('Chart animation', () => {
  let page: Page;
  let probe: ChartMotionProbe;
  beforeAll(async () => {
    page = await openScene('chart-motion');
    probe = await page.evaluate(async () => {
      if (!window.chartMotionProbe) {
        throw new Error('Missing chart motion probe.');
      }
      return window.chartMotionProbe;
    });
  });
  afterAll(async () => {
    await page?.close();
  });
  test('fades axis titles and tick labels before the reveal finishes', () => {
    for (const title of ['Time (s)', 'Position']) {
      expect(
        probe.labels.some(
          label =>
            label.text === title &&
            label.progress < 1 &&
            label.alpha > 0 &&
            label.alpha < 1,
        ),
      ).toBe(true);
      expect(
        probe.labels.some(label => label.text === title && label.alpha === 1),
      ).toBe(true);
    }
    expect(
      probe.labels.some(
        label => label.text === '0.4' && label.alpha > 0 && label.alpha < 1,
      ),
    ).toBe(true);
  });
  test('advances horizontally in time along the easing curve', () => {
    expect(probe.tips.length).toBeGreaterThan(10);
    for (const tip of probe.tips) {
      expect(tip.x).toBeCloseTo(tip.progress, 5);
      expect(Math.abs(tip.y - (1 - (1 - tip.progress) ** 3))).toBeLessThan(
        0.0003,
      );
    }
  });
  test('keeps the full boundary stroke and caps while clipping distant data', () => {
    expect(probe).toMatchObject({
      fullStroke: true,
      fullCap: true,
      clippedOutside: true,
    });
  });
  test('supports empty, immediate, and cancelled reveals without a stray cap', () => {
    expect(probe).toMatchObject({
      zeroProgress: true,
      zeroDuration: true,
      cancelled: true,
    });
  });
  test('keeps cloned progress independent and preserves explicit native end overrides', () => {
    expect(probe).toMatchObject({nativeEnd: true, cloneIndependent: true});
  });
  test('uses theme easing for drawing and erasing, with an explicit linear override', () => {
    for (const phase of ['reveal', 'erase', 'linear']) {
      const samples = probe.timings.filter(sample => sample.phase === phase);
      expect(samples.length).toBeGreaterThan(20);
      for (const sample of samples) {
        const expected =
          phase === 'reveal'
            ? sample.elapsed ** 2
            : phase === 'erase'
              ? (1 - sample.elapsed) ** 2
              : sample.elapsed;
        expect(sample.progress).toBeCloseTo(expected, 5);
        expect(sample.tip).toBeCloseTo(sample.progress, 5);
      }
    }
  });
});
