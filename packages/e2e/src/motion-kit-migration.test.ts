import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {MigrationProbe} from '../tests/scenes/motion-kit-migration.probe';
import {openScene} from './helpers/render';

describe('Depth Canvas migration', () => {
  let page: Page;
  let probe: MigrationProbe;
  beforeAll(async () => {
    page = await openScene('motion-kit-migration');
    probe = await page.evaluate(async () => {
      if (!window.migrationProbe) throw new Error('Missing migration probe.');
      return window.migrationProbe;
    });
  });
  afterAll(async () => {
    await page?.close();
  });
  test('preserves layout and signal bindings during push and deterministic flash effects', () => {
    expect(probe.flashRuns[0]).toEqual(probe.flashRuns[1]);
    expect(probe.flashRuns[0]).toEqual(expect.arrayContaining([0, 1]));
    expect(probe).toMatchObject({
      pushStable: true,
      pushBinding: true,
      flashOut: true,
    });
  });
  test('maps overlays through transformed parents and cleans up after completion or cancellation', () => {
    expect(probe).toMatchObject({
      wipeMapped: true,
      wipeClean: true,
      cancelClean: true,
      morphFinal: true,
      textFinal: true,
    });
  });
  test('maps document regions reactively without layout nodes', () => {
    expect(probe).toMatchObject({regionMapped: true, regionResponsive: true});
  });
  test('moves the page focus in both directions and derives clone positions independently', () => {
    expect(probe).toMatchObject({
      stackWindow: true,
      stackBackward: true,
      stackClone: true,
    });
  });
  test('casts a shadow on the page below and respects native shadow overrides', () => {
    expect(probe).toMatchObject({
      stackShadow: true,
      stackShadowOverride: true,
    });
  });
  test('maps chart coordinates, filters ticks, and clips data while preserving independent clones', () => {
    expect(probe).toMatchObject({
      chartMapped: true,
      chartReactive: true,
      chartTicks: true,
      chartInvalid: true,
      chartClone: true,
      zeroLine: true,
      clippedLine: true,
    });
  });
  test('uses existing card and slide parts for their new entrances', () => {
    expect(probe).toMatchObject({cardWipe: true, slideStaged: true});
  });
  test('staggers card title, description, and content wipes in reading order', () => {
    expect(probe.cardSwipeOrder[0]).toBeGreaterThanOrEqual(0);
    expect(probe.cardSwipeOrder[1] - probe.cardSwipeOrder[0]).toBeCloseTo(
      0.1,
      1,
    );
    expect(probe.cardSwipeOrder[2] - probe.cardSwipeOrder[1]).toBeCloseTo(
      0.1,
      1,
    );
  });
  test('staggers slide heading swipes without moving them and supports replay and cancellation', () => {
    expect(probe).toMatchObject({
      slideWiped: true,
      slideReplay: true,
      slideCancelled: true,
    });
  });
  test('starts generic slide swipes in title, subtitle, content order and supports blank slides', () => {
    expect(probe.slideOrder[0]).toBeGreaterThanOrEqual(0);
    expect(probe.slideOrder[1] - probe.slideOrder[0]).toBeCloseTo(0.1, 1);
    expect(probe.slideOrder[2] - probe.slideOrder[1]).toBeCloseTo(0.1, 1);
    expect(probe.blankSlideExit).toBe(true);
  });
  test('swipes slides in with the same reading order and restores cancelled entrances', () => {
    expect(probe.slideSwipeIn).toBe(true);
    expect(probe.slideEnterCancelled).toBe(true);
    expect(probe.slideEnterOrder[0]).toBeGreaterThanOrEqual(0);
    expect(probe.slideEnterOrder[1] - probe.slideEnterOrder[0]).toBeCloseTo(
      0.1,
      1,
    );
    expect(probe.slideEnterOrder[2] - probe.slideEnterOrder[1]).toBeCloseTo(
      0.1,
      1,
    );
  });
});
