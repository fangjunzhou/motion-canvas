import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {EffectsMotionProbe} from '../tests/scenes/effects-motion.probe';
import {openScene} from './helpers/render';

describe('Motion effects in layouts', () => {
  let page: Page;
  let probe: EffectsMotionProbe;
  beforeAll(async () => {
    page = await openScene('effects-motion');
    probe = await page.evaluate(async () => {
      if (!window.effectsMotionProbe) {
        throw new Error('Missing effects motion probe.');
      }
      return window.effectsMotionProbe;
    });
  });
  afterAll(async () => {
    await page?.close();
  });
  test('covers the card handoff with a solid color block above both stationary layout slots', () => {
    expect(probe).toMatchObject({
      stableSlots: true,
      colorBlock: true,
      coveredSource: true,
      coveredTarget: true,
      sharedLayer: true,
    });
  });
  test('flickers from the first caption into To the Next', () => {
    expect(probe.titleChanged).toBe(true);
  });

  test('fits a group wipe to its text rather than its allocated layout width', () => {
    expect(probe.glyphWidth).toBeGreaterThan(50);
    expect(probe.glyphWidth).toBeLessThan(probe.allocatedWidth / 2);
  });
  test('clips wipes to rounded corners and preserves the card stroke', () => {
    expect(probe.border).toEqual([255, 255, 255, 255]);
    expect(probe.cornerAlpha).toBe(0);
  });
  test('preserves inherited typography and cleans up cancelled overlays', () => {
    expect(probe).toMatchObject({cancelled: true, inheritedFont: true});
  });
  test('restores cancelled rectangle covers and supports immediate handoffs and fill overrides', () => {
    expect(probe).toMatchObject({
      rectCancelled: true,
      rectImmediate: true,
      fillOverride: true,
    });
  });
});
