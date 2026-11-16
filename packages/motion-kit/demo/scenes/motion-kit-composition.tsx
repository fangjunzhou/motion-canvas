import {Circle, Layout, Line, makeScene2D, Rect, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  createSignal,
  Vector2,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import type {MotionMethods} from '../../registry/motion/contracts';
import {MotionKitStage, ShowcaseTheme} from '../components/MotionKitStage';

const Steps = ['enter', 'emphasize', 'exit'];

const CurvePoints = [
  [0, 0.8],
  [0.2, 0.8],
  [0.35, 0.3],
  [0.55, 0.6],
  [0.75, 0.2],
  [0.9, 0.4],
  [1, 0.2],
] satisfies readonly [number, number][];

export default makeScene2D(function* (view) {
  const theme = ShowcaseTheme;
  const stage = createRef<MotionKitStage>();
  const panel = createRef<Rect>();
  const track = createRef<Rect>();
  const chart = createRef<Layout>();
  const progress = createSignal(0);
  const phase = createSignal('enter');
  const status = createSignal('Ready');

  const motion = {
    *enter(
      duration = theme.motion.medium,
      easing = theme.motion.enter,
    ): ThreadGenerator {
      yield* all(
        panel().opacity(1, duration, easing),
        panel().scale(1, duration, easing),
      );
    },
    *emphasize(
      duration = theme.motion.medium,
      easing = theme.motion.emphasize,
    ): ThreadGenerator {
      yield* all(
        panel().stroke(theme.colors.accent, duration, easing),
        panel().scale(1.02, duration, easing),
      );
      yield* all(
        panel().stroke(theme.colors.border, duration, easing),
        panel().scale(1, duration, easing),
      );
    },
    *exit(
      duration = theme.motion.medium,
      easing = theme.motion.exit,
    ): ThreadGenerator {
      yield* all(
        panel().opacity(0, duration, easing),
        panel().scale(0.94, duration, easing),
      );
    },
  } satisfies MotionMethods;

  view.fill(theme.colors.background);
  view.add(
    <MotionKitStage
      ref={stage}
      opacity={0}
      size={() => view.size()}
      heading="Scene composition and animation"
      subtitle="The percentage, bar, and curve share one progress signal."
    >
      <Layout grow={1} gap={theme.spacing.medium}>
        <Rect
          ref={panel}
          layout
          direction="column"
          grow={2}
          basis={0}
          minWidth={0}
          padding={theme.spacing.medium}
          gap={theme.spacing.medium}
          radius={theme.radius.medium}
          fill={theme.colors.surface}
          stroke={theme.colors.border}
          lineWidth={3}
          opacity={0}
          scale={0.94}
        >
          <Rect
            layout
            alignSelf="start"
            alignItems="center"
            padding={[theme.spacing.small / 2, theme.spacing.small]}
            gap={theme.spacing.small / 2}
            radius={theme.radius.small}
            fill={theme.colors.background}
          >
            <Txt
              text={status}
              fontSize={theme.typography.body * 0.75}
              fill={theme.colors.accent}
            />
          </Rect>
          <Layout direction="column" gap={theme.spacing.small}>
            <Layout justifyContent="space-between">
              <Txt
                text="Animation progress"
                fontSize={theme.typography.body}
                fill={theme.colors.muted}
              />
              <Txt
                text={() => `${Math.round(progress() * 100)}%`}
                fontSize={theme.typography.body}
                fill={theme.colors.foreground}
              />
            </Layout>
            <Rect
              ref={track}
              height={theme.spacing.small}
              radius={theme.radius.small}
              fill={theme.colors.background}
            >
              <Rect
                layout={false}
                width={() => track().width() * progress()}
                x={() => (track().width() * (progress() - 1)) / 2}
                height={() => track().height()}
                radius={theme.radius.small}
                fill={theme.colors.accent}
              />
              <Circle
                layout={false}
                x={() => track().width() * (progress() - 0.5)}
                size={theme.spacing.medium}
                fill={theme.colors.foreground}
                stroke={theme.colors.surface}
                lineWidth={theme.spacing.small / 4}
              />
            </Rect>
          </Layout>
          <Layout ref={chart} grow={1} basis={0} minHeight={0}>
            <Line
              layout={false}
              points={() =>
                CurvePoints.map(
                  ([x, y]) =>
                    new Vector2(
                      chart().width() * (x - 0.5),
                      chart().height() * (y - 0.5),
                    ),
                )
              }
              end={progress}
              radius={theme.radius.medium}
              stroke={theme.colors.accent}
              lineWidth={theme.spacing.small / 4}
              lineCap="round"
            />
          </Layout>
        </Rect>
        <Layout
          direction="column"
          grow={1}
          basis={0}
          minWidth={0}
          gap={theme.spacing.medium}
        >
          {Steps.map(name => (
            <Rect
              layout
              grow={1}
              basis={0}
              justifyContent="center"
              alignItems="center"
              padding={theme.spacing.medium}
              radius={theme.radius.medium}
              fill={theme.colors.surface}
              stroke={() =>
                phase() === name ? theme.colors.accent : theme.colors.border
              }
              lineWidth={2}
            >
              <Txt
                text={`${name}()`}
                fontSize={theme.typography.body}
                fill={theme.colors.foreground}
              />
            </Rect>
          ))}
        </Layout>
      </Layout>
    </MotionKitStage>,
  );

  yield* all(
    stage().opacity(1, theme.motion.medium, theme.motion.enter),
    motion.enter(0.6),
  );
  yield* waitFor(0.6);
  status('Animating');
  yield* progress(1, 2.4, theme.motion.emphasize);
  status('Complete');
  phase('emphasize');
  yield* motion.emphasize();
  yield* waitFor(1);
  status('Updated locally');
  yield* progress(0.68, 1.2, theme.motion.emphasize);
  yield* waitFor(2);
  phase('exit');
  yield* motion.exit(0.6);
  yield* waitFor(0.6);
  phase('enter');
  yield* motion.enter(0.6);
  yield* waitFor(3);
  yield* stage().opacity(0, theme.motion.medium, theme.motion.exit);
});
