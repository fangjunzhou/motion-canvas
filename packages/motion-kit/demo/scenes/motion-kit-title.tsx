import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {TitleSlide} from '../../registry/components/Slide';
import {defaultTheme} from '../../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;
  const slide = createRef<TitleSlide>();

  view.fill(theme.colors.background);
  view.add(
    <TitleSlide
      ref={slide}
      title="Motion Kit Component Demo"
      subtitle="GitHub @ fangjunzhou"
      size={() => view.size()}
      opacity={0}
    />,
  );

  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* waitFor(3);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
