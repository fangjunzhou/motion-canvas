import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  Vector2,
  all,
  createSignal,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import example from '../../../motion-kit/examples/slide';
import {
  BlankSlide,
  ContentSlide,
  SectionSlide,
  Slide,
  TitleSlide,
} from '../../../motion-kit/registry/components/Slide';
import {createTheme} from '../../../motion-kit/registry/foundations/theme';
import type {SlideLayoutProbe, SlideLayoutSample} from './slide-layout.probe';

const Published: {resolve: (probe: SlideLayoutProbe) => void} = {
  resolve: () => {},
};
window.slideLayoutProbe = new Promise(resolve => {
  Published.resolve = resolve;
});

function read(slide: Slide): SlideLayoutSample {
  const [header, content] = slide.children();
  if (!(header instanceof Layout) || !(content instanceof Layout)) {
    throw new Error('Missing slide layout areas.');
  }
  const [heading, subtitle] = header.children();
  if (!(heading instanceof Txt) || !(subtitle instanceof Txt)) {
    throw new Error('Missing slide text nodes.');
  }
  return {
    width: slide.width(),
    height: slide.height(),
    padding: slide.padding.top(),
    gap: slide.rowGap(),
    title: heading.text(),
    titleSize: heading.fontSize(),
    subtitleSize: subtitle.fontSize(),
    headerHeight: header.height(),
    headingHeight: heading.height(),
    headerY: header.position.y(),
    headerInLayout: header.layoutSelf() !== false,
    contentHeight: content.height(),
    contentCount: content.children().length,
    frameCount: slide.children().length,
  };
}

export default makeScene2D(function* (view) {
  const layouts: SlideLayoutProbe['layouts'] = {};
  for (const Frame of [TitleSlide, ContentSlide, SectionSlide, BlankSlide]) {
    const slide = new Frame({
      title: 'Light and motion',
      subtitle: 'A rendering study',
    });
    view.add(slide);
    layouts[slide.variant()] = read(slide);
    slide.remove();
    slide.dispose();
  }

  const size = createSignal(new Vector2(1280, 720));
  const title = createSignal('The first title');
  const slide = new ContentSlide({
    size,
    title,
    children: new Layout({grow: 1, children: new Txt({text: 'Content'})}),
  });
  view.add(slide);
  layouts.resized = read(slide);
  title('The next title');
  size(new Vector2(960, 540));
  layouts.reactive = read(slide);
  const copy = slide.clone({title: 'A separate title'});
  view.add(copy);
  copy.theme(
    createTheme({
      typography: {heading: 72},
      padding: {large: 40},
      spacing: {medium: 24},
    }),
  );
  layouts.clone = read(copy);
  layouts.original = read(slide);
  copy.padding.top(12);
  copy.gap(10);
  copy.theme(createTheme({padding: {large: 48}}));
  layouts.overrides = read(copy);
  slide.subtitle('An optional subtitle');
  layouts.withSubtitle = read(slide);
  slide.subtitle('');
  layouts.withoutSubtitle = read(slide);
  slide.variant('blank');
  layouts.blankContent = read(slide);
  for (const frame of [slide, copy]) {
    frame.remove();
    frame.dispose();
  }

  const exampleVariants = new Set<string>();
  let fadeFrames = 0;
  let running = true;
  yield* all(
    (function* (): ThreadGenerator {
      yield* example.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        const frame = view.children().find(node => node instanceof Slide);
        if (frame) {
          exampleVariants.add(frame.variant());
          if (frame.opacity() > 0 && frame.opacity() < 1) fadeFrames++;
        }
        yield;
      }
    })(),
  );
  Published.resolve({
    layouts,
    exampleVariants: [...exampleVariants],
    fadeFrames,
  });
  yield* waitFor(0.2);
});
