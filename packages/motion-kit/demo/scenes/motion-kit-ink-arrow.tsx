import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, createSignal, waitFor} from '@canvas-commons/core';
import {InkArrow} from '../../registry/components/InkArrow';
import {ContentSlide} from '../../registry/components/Slide';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<ContentSlide>();
  const arrow = createRef<InkArrow>();
  const path = createRef<Layout>();
  const bend = createSignal(-1);
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      title="Ink Arrow"
      subtitle="Draw the path, then the arrowhead."
      {...fitSlide(view)}
      opacity={0}
    >
      <Layout grow={1} alignItems="center" gap={theme.spacing.medium}>
        <Txt text="Start" shrink={0} fill={theme.colors.muted} />
        <Layout ref={path} grow={1} basis={0} minWidth={0} height="100%">
          <InkArrow
            ref={arrow}
            theme={theme}
            from={() => [-path().width() / 2, 0]}
            to={() => [path().width() / 2, 0]}
            curvature={() =>
              bend() *
              Math.min(0.35, path().height() / Math.max(1, path().width()) / 2)
            }
            color={theme.colors.accent}
            strokeWidth={14}
            headSize={42}
          />
        </Layout>
        <Txt text="Next Step" shrink={0} fill={theme.colors.foreground} />
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* arrow().reveal();
  yield* waitFor(1);
  yield* arrow().erase();
  bend(1);
  arrow().seed('second-pose');
  yield* arrow().reveal();
  yield* waitFor(1.5);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
