import {Layout, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, easeOutCubic, waitFor} from '@canvas-commons/core';
import {Chart, ChartAxis, ChartLine} from '../../registry/components/Chart';
import {ContentSlide} from '../../registry/components/Slide';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<ContentSlide>();
  const x = createRef<ChartAxis>();
  const y = createRef<ChartAxis>();
  const line = createRef<ChartLine>();
  const duration = 1;
  const samples = 60;
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      {...fitSlide(view)}
      title="Animation Curve"
      subtitle="Ease out by covering less distance with each frame."
      opacity={0}
    >
      <Layout
        grow={1}
        minHeight={0}
        direction="column"
        alignItems="stretch"
        justifyContent="center"
        padding={[
          theme.padding.large,
          theme.padding.large * 2,
          theme.padding.large * 2,
        ]}
      >
        <Chart
          theme={theme}
          width={null}
          height={null}
          minWidth={0}
          grow={1}
          basis={0}
          minHeight={0}
          xRange={[0, duration]}
          yRange={[0, 1]}
        >
          <ChartAxis ref={x} orientation="x" label="Time (s)" progress={0} />
          <ChartAxis ref={y} orientation="y" label="Position" progress={0} />
          <ChartLine
            ref={line}
            data={Array.from({length: samples + 1}, (_, i) => [
              (duration * i) / samples,
              easeOutCubic(i / samples),
            ])}
            progress={0}
            lineWidth={8}
          />
        </Chart>
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* all(x().reveal(), y().reveal());
  yield* line().reveal(duration);
  yield* waitFor(1.5);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
