import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {CardMotionProbe} from '../tests/scenes/card-motion.probe';
import {openScene} from './helpers/render';

describe('Card animations', () => {
  let page: Page;
  let probe: CardMotionProbe;

  beforeAll(async () => {
    page = await openScene('card-motion');
    probe = await page.evaluate(async () => {
      if (!window.cardMotionProbe) {
        throw new Error('Missing Card animation probe.');
      }
      return window.cardMotionProbe;
    });
  });

  afterAll(async () => {
    await page?.close();
  });

  test('collapses missing descriptions and content without leaving section gaps', () => {
    const parts = probe.optionalParts;
    expect(parts.withoutDescription).toBeLessThan(parts.full);
    expect(parts.withoutContent).toBeLessThan(parts.full);
    expect(parts.titleOnly).toBeLessThan(parts.withoutDescription);
    expect(parts.titleOnly).toBeLessThan(parts.withoutContent);
    expect(parts.titleOnly).toBe(parts.omitted);
    expect(parts.clone).toBe(parts.omitted);
    expect(parts.restored).toBe(parts.full);
  });

  test('keeps the status footer at the same vertical position while its badge changes text', () => {
    expect(new Set(probe.badgeLayout.map(sample => sample.text))).toEqual(
      new Set(['Ready', 'Animating', 'Complete', 'Progress adjusted']),
    );
    expect(
      new Set(probe.badgeLayout.map(sample => sample.width)).size,
    ).toBeGreaterThan(4);
    expect(probe.badgeLayout.every(sample => sample.automaticHeight)).toBe(
      true,
    );
    const stationary = probe.badgeLayout.filter(sample => sample.stationary);
    expect(stationary.length).toBeGreaterThan(0);
    expect(new Set(stationary.map(sample => sample.footerY)).size).toBe(1);
  });

  test('uses independent theme padding, gaps, and typography with explicit overrides', () => {
    expect(probe.styles.defaults).toEqual({
      padding: 32,
      gap: 32,
      contentPadding: 32,
      footerPadding: 32,
      titleSize: 54,
      bodySize: 48,
      footerSize: 30,
      badgeSize: 32,
    });
    expect(probe.styles.original).toEqual(probe.styles.defaults);
    expect(probe.styles.clone).toEqual({
      padding: 40,
      gap: 24,
      contentPadding: 40,
      footerPadding: 40,
      titleSize: 36,
      bodySize: 26,
      footerSize: 18,
      badgeSize: 32,
    });
    expect(probe.styles.updated).toEqual({
      ...probe.styles.clone,
      badgeSize: 16,
    });
    expect(probe.styles.compact).toMatchObject({
      padding: 12,
      gap: 8,
      contentPadding: 12,
      footerPadding: 12,
    });
    expect(probe.styles.override).toMatchObject({
      padding: 10,
      gap: 10,
      contentPadding: 10,
      footerPadding: 10,
    });
    expect(probe.styles.reset).toEqual(probe.styles.compact);
    expect(probe.styles.native).toMatchObject({
      padding: 5,
      gap: 6,
      contentPadding: 7,
      footerPadding: 32,
      titleSize: 54,
      bodySize: 48,
      footerSize: 30,
    });
  });

  test('reveals the title, description, and content in order', () => {
    const title = probe.samples.findIndex(sample => sample.titleOpacity > 0);
    const description = probe.samples.findIndex(
      sample => sample.descriptionOpacity > 0,
    );
    const content = probe.samples.findIndex(
      sample => sample.contentOpacity > 0,
    );
    expect(title).toBeGreaterThanOrEqual(0);
    expect(description).toBeGreaterThan(title);
    expect(content).toBeGreaterThan(description);
    expect(probe.samples[description].titleOpacity).toBe(1);
    expect(probe.samples[content].descriptionOpacity).toBe(1);
    expect(
      probe.samples.slice(0, content).every(sample => !sample.footerVisible),
    ).toBe(true);
  });

  test('animates footer layout without changing the content width', () => {
    const initial = probe.samples[0];
    const shownIndex = probe.samples.findIndex(
      sample => sample.footerOpacity === 1,
    );
    const shown = probe.samples[shownIndex];
    expect(shown?.height).toBeGreaterThan(initial.height);
    expect(
      probe.samples.some(
        sample =>
          sample.height > initial.height &&
          sample.height < (shown?.height ?? 0),
      ),
    ).toBe(true);
    const hiddenAgain = probe.samples
      .slice(shownIndex + 1)
      .find(
        sample =>
          !sample.footerVisible &&
          sample.titleOpacity === 1 &&
          sample.width === 720 &&
          Math.abs(sample.height - initial.height) < 1,
      );
    expect(hiddenAgain).toBeDefined();
    expect(
      probe.samples.every(
        sample => Math.abs(sample.width - sample.contentWidth) < 1,
      ),
    ).toBe(true);
  });

  test('finishes resizing before replacing any text', () => {
    const resizing = probe.samples.filter(
      sample => sample.width > 721 && sample.width < 839,
    );
    expect(resizing.length).toBeGreaterThan(0);
    expect(
      resizing.every(
        sample =>
          sample.title === 'Anticipation' &&
          sample.titleOpacity === 0 &&
          sample.contentOpacity === 0,
      ),
    ).toBe(true);
    const changed = probe.samples.find(
      sample => sample.title === 'Follow-Through',
    );
    expect(changed?.width).toBe(840);
    expect(
      probe.samples.some(
        sample =>
          sample.footerText.includes('05 / 12') && sample.footerOpacity === 1,
      ),
    ).toBe(true);
  });

  test('handles zero durations, repetition, and independent clones', () => {
    expect(probe.zeroDuration).toMatchObject({
      title: 'Timing',
      titleOpacity: 1,
      descriptionOpacity: 1,
      contentOpacity: 1,
      footerVisible: false,
      footerOpacity: 0,
    });
    expect(probe.repeatedFooterHeight).toBe(0);
    expect(probe.restoredHeightBinding).toBe(true);
    expect(probe.independent).toBe(true);
  });

  test('restores size bindings and opacity if a text change is cancelled', () => {
    expect(probe.cancelled).toMatchObject({
      title: 'Timing',
      width: 840,
      titleOpacity: 1,
      descriptionOpacity: 1,
      contentOpacity: 1,
      footerVisible: false,
    });
  });
  test('shows and hides images without leaving layout space or rewrapping text', () => {
    const show = probe.images.filter(sample => sample.phase === 'show');
    const hide = probe.images.filter(sample => sample.phase === 'hide');
    expect(
      show.some(
        sample => sample.height > show[0].height && sample.opacity === 0,
      ),
    ).toBe(true);
    expect(show.at(-1)).toMatchObject({visible: true, opacity: 1});
    expect(hide.at(-1)).toMatchObject({visible: false, opacity: 0});
    expect(
      probe.images.filter(sample => sample.phase === 'hidden-change').at(-1)
        ?.height,
    ).toBeCloseTo(show[0].height, 0);
    expect(
      probe.images.every(
        sample =>
          (sample.contentOpacity === 0 ||
            sample.width === sample.contentWidth) &&
          sample.loaded,
      ),
    ).toBe(true);
  });

  test('changes image source while faded out and preserves hidden images', () => {
    const changing = probe.images.filter(sample => sample.phase === 'change');
    const source = changing[0].src;
    const changed = changing.find(sample => sample.src !== source);
    expect(changed?.opacity).toBe(0);
    expect(
      changing.some(sample => sample.opacity > 0 && sample.opacity < 1),
    ).toBe(true);
    expect(changing.at(-1)).toMatchObject({
      description: 'Stanford bunny',
      visible: true,
      opacity: 1,
      width: 300,
      imageWidth: 300,
      imageHeight: 300,
    });
    expect(
      changing.every(sample => Math.abs(sample.width - sample.imageWidth) < 1),
    ).toBe(true);
    expect(
      changing.some(
        sample =>
          sample.imageWidth > 301 &&
          sample.imageWidth < 399 &&
          sample.imageHeight > 121 &&
          sample.imageHeight < 299,
      ),
    ).toBe(true);
    expect(changing.at(-1)?.imageWidth).toBe(300);
    expect(changing.at(-1)?.imageHeight).toBe(300);
    const hidden = probe.images.filter(
      sample => sample.phase === 'hidden-change',
    );
    expect(
      hidden.every(sample => !sample.visible && sample.opacity === 0),
    ).toBe(true);
    expect(hidden.at(-1)?.src).toBe(source);
    expect(hidden.at(-1)?.description).toBe('Cornell box');
  });

  test('restores image state after cancellation and supports zero durations and clones', () => {
    expect(probe.imageZeroDuration).toMatchObject({
      description: 'Stanford bunny',
      visible: true,
      opacity: 1,
      loaded: true,
      width: 300,
      imageWidth: 300,
      imageHeight: 300,
    });
    expect(probe.imageCancelled).toMatchObject({
      description: 'Stanford bunny',
      visible: true,
      opacity: 1,
      src: probe.imageZeroDuration.src,
      width: 300,
      imageWidth: 300,
      imageHeight: 300,
    });
    expect(probe.imageHeightRestored).toBe(true);
    expect(probe.imageIndependent).toBe(true);
  });
});
