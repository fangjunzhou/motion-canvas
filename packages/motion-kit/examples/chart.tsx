import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, easeOutCubic, waitFor} from '@canvas-commons/core';
import {Chart, ChartAxis, ChartLine} from '../registry/components/Chart';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const x = createRef<ChartAxis>();
  const y = createRef<ChartAxis>();
  const line = createRef<ChartLine>();
  const duration = 2;
  const samples = 60;
  view.fill(defaultTheme.colors.background);
  view.add(
    <Chart size={[1000, 500]} xRange={[0, duration]} yRange={[0, 1]}>
      <ChartAxis ref={x} orientation="x" label="Time (s)" progress={0} />
      <ChartAxis ref={y} orientation="y" label="Position" progress={0} />
      <ChartLine
        ref={line}
        data={Array.from({length: samples + 1}, (_, i) => [
          (duration * i) / samples,
          easeOutCubic(i / samples),
        ])}
        progress={0}
      />
    </Chart>,
  );
  yield* all(x().reveal(), y().reveal());
  yield* line().reveal(duration);
  yield* waitFor(1);
});
