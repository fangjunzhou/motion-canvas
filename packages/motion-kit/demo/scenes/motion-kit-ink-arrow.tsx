import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {InkArrow} from '../../registry/components/InkArrow';
import {ContentSlide} from '../../registry/components/Slide';
import {defaultTheme} from '../../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;
  const slide = createRef<ContentSlide>();
  const arrow = createRef<InkArrow>();
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      title="Ink Arrow"
      subtitle="Draw the path, then the arrowhead."
      size={() => view.size()}
      opacity={0}
    >
      <Layout grow={1}>
        <Txt
          layoutSelf={false}
          position={[-460, 120]}
          text="Start"
          fill={theme.colors.muted}
        />
        <InkArrow
          ref={arrow}
          from={[-400, 60]}
          to={[400, -60]}
          curvature={-0.35}
          color={theme.colors.accent}
          strokeWidth={14}
          headSize={42}
        />
        <Txt
          layoutSelf={false}
          position={[460, -160]}
          text="Next step"
          fill={theme.colors.foreground}
        />
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* arrow().reveal();
  yield* waitFor(1);
  yield* arrow().erase();
  arrow().curvature(0.35);
  arrow().seed('second-pose');
  yield* arrow().reveal();
  yield* waitFor(1.5);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
