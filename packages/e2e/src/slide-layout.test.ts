import type {Page} from 'playwright';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import type {SlideLayoutProbe} from '../tests/scenes/slide-layout.probe';
import {openScene} from './helpers/render';

describe('presentation slide layouts', () => {
  let page: Page;
  let probe: SlideLayoutProbe;

  beforeAll(async () => {
    page = await openScene('slide-layout');
    probe = await page.evaluate(async () => {
      if (!window.slideLayoutProbe) {
        throw new Error('Missing slide layout probe.');
      }
      return window.slideLayoutProbe;
    });
  });

  afterAll(async () => {
    await page?.close();
  });

  test('uses the Keynote widescreen reference and distinct presentation headings', () => {
    for (const variant of ['title', 'content', 'section', 'blank']) {
      expect(probe.layouts[variant]).toMatchObject({
        width: 1920,
        height: 1080,
        padding: 64,
      });
    }
    expect(probe.layouts.title).toMatchObject({
      titleSize: 112,
      subtitleSize: 54,
      headerY: 0,
    });
    expect(probe.layouts.section).toMatchObject({
      titleSize: 84,
      subtitleSize: 54,
      headerY: 0,
    });
    expect(probe.layouts.content).toMatchObject({
      titleSize: 84,
      subtitleSize: 48,
    });
    expect(probe.layouts.content.headerY).toBeLessThan(0);
    expect(probe.layouts.blank.headerInLayout).toBe(false);
  });

  test('follows reactive text, dimensions, and themes without sharing clone internals', () => {
    expect(probe.layouts.resized).toMatchObject({width: 1280, height: 720});
    expect(probe.layouts.reactive).toMatchObject({
      width: 960,
      height: 540,
      title: 'The next title',
    });
    expect(probe.layouts.clone).toMatchObject({
      title: 'A separate title',
      titleSize: 72,
      padding: 40,
      gap: 24,
      frameCount: 2,
      contentCount: 1,
    });
    expect(probe.layouts.original).toMatchObject({
      title: 'The next title',
      titleSize: 84,
      padding: 64,
      gap: 32,
    });
    expect(probe.layouts.overrides).toMatchObject({padding: 12, gap: 10});
  });

  test('gives content the remaining height and removes empty text placeholders', () => {
    expect(probe.layouts.withoutSubtitle.headerHeight).toBe(
      probe.layouts.withoutSubtitle.headingHeight,
    );
    expect(probe.layouts.withSubtitle.headerHeight).toBeGreaterThan(
      probe.layouts.withoutSubtitle.headerHeight,
    );
    expect(probe.layouts.withSubtitle.contentHeight).toBeLessThan(
      probe.layouts.withoutSubtitle.contentHeight,
    );
    expect(probe.layouts.blankContent).toMatchObject({
      headerInLayout: false,
      contentHeight: 412,
    });
  });

  test('plays all four canonical example layouts with native fade transitions', () => {
    expect(probe.exampleVariants).toEqual([
      'title',
      'section',
      'content',
      'blank',
    ]);
    expect(probe.fadeFrames).toBeGreaterThan(0);
  });
});
