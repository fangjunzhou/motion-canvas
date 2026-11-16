import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {HighlightProbe} from '../tests/scenes/highlight-motion.probe';
import {openScene} from './helpers/render';
describe('native text highlight', () => {
  let page: Page;
  let probe: HighlightProbe;
  beforeAll(async () => {
    page = await openScene('highlight-motion');
    probe = await page.evaluate(async () => {
      if (!window.highlightProbe) {
        throw new Error('Missing highlight probe.');
      }
      return window.highlightProbe;
    });
  });
  afterAll(async () => {
    await page?.close();
  });
  test('draws and retracts the marker without resizing the text', () => {
    expect(probe.samples.some(s => s.progress > 0 && s.progress < 1)).toBe(
      true,
    );
    expect(
      probe.samples.some(
        (s, i) => i > 0 && s.progress < probe.samples[i - 1].progress,
      ),
    ).toBe(true);
    expect(new Set(probe.samples.map(s => `${s.width},${s.height}`)).size).toBe(
      1,
    );
    expect(probe.erased).toBe(0);
    expect(probe.revealed).toBe(1);
  });
  test('measures wrapped phrase selection and handles empty or missing matches', () => {
    expect(probe.samples[0].boxes).toHaveLength(1);
    expect(probe.samples.some(s => s.boxes.length > 1)).toBe(true);
    expect(
      probe.samples.every(s => s.boxes.every(b => b.width > 0 && b.height > 0)),
    ).toBe(true);
    expect(probe.missing).toBe(0);
    expect(probe.empty).toBe(0);
    expect(probe.allLines).toBeGreaterThan(1);
  });
  test('clones text and marker signals independently', () => {
    expect(probe.independent).toBe(true);
  });
  test('plays the straight style by default and retains the hand-drawn option', () => {
    expect(probe.samples[0].style).toBe('straight');
    expect(new Set(probe.samples.map(sample => sample.style))).toEqual(
      new Set(['straight', 'hand-drawn']),
    );
  });
});
