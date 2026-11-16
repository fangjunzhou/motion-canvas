import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {TitleSlide} from '../../registry/components/Slide';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<TitleSlide>();

  view.fill(theme.colors.background);
  view.add(
    <TitleSlide
      ref={slide}
      theme={theme}
      title="Motion Kit Component Demo"
      subtitle="GitHub @ fangjunzhou"
      {...fitSlide(view)}
      opacity={0}
    />,
  );

  yield* slide().swipeIn(1.2);
  yield* waitFor(3);
  yield* slide().swipeOut();
});
