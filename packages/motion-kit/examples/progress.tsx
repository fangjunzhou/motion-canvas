import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {createSignal, waitFor} from '@canvas-commons/core';
import {Progress} from '../registry/components/Progress';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const value = createSignal(0);
  view.fill(defaultTheme.colors.background);
  view.add(
    <Layout
      layout
      direction="column"
      width={640}
      gap={defaultTheme.spacing.small}
    >
      <Layout justifyContent="space-between">
        <Txt
          text="Rendering progress"
          fontSize={defaultTheme.typography.body}
          fill={defaultTheme.colors.muted}
        />
        <Txt
          text={() => `${Math.round(value())}%`}
          fontSize={defaultTheme.typography.body}
          fill={defaultTheme.colors.foreground}
        />
      </Layout>
      <Progress value={value} />
    </Layout>,
  );
  yield* value(100, 2, defaultTheme.motion.emphasize);
  yield* waitFor(1);
  yield* value(68, 1);
  yield* waitFor(1);
});
