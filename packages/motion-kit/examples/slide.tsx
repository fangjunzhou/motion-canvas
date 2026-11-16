import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {
  BlankSlide,
  ContentSlide,
  SectionSlide,
  TitleSlide,
} from '../registry/components/Slide';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;
  const slides = [
    new TitleSlide({
      title: 'Light and Motion',
      subtitle: 'A study in rendering',
      size: () => view.size(),
    }),
    new SectionSlide({
      title: 'Start with a Simple Scene',
      subtitle: 'Change one thing at a time.',
      size: () => view.size(),
    }),
    new ContentSlide({
      title: 'Follow the Light',
      subtitle:
        'Use the content area for diagrams, images, or native components.',
      size: () => view.size(),
      children: (
        <Layout grow={1} alignItems="center" justifyContent="center">
          <Txt
            text="Light reflects from one surface to the next."
            textWrap
            fill={theme.colors.foreground}
          />
        </Layout>
      ),
    }),
    new BlankSlide({
      size: () => view.size(),
      children: (
        <Layout grow={1} alignItems="center" justifyContent="center">
          <Txt
            text="Leave Room for the Image"
            fontSize={theme.typography.heading}
            fill={theme.colors.foreground}
          />
        </Layout>
      ),
    }),
  ];
  view.fill(theme.colors.background);
  for (const slide of slides) {
    slide.opacity(0);
    view.add(slide);
    yield* slide.swipeIn();
    yield* waitFor(1.6);
    yield* slide.swipeOut();
    slide.remove();
  }
});
