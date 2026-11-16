import {Layout, Line, makeScene2D, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  createSignal,
  Vector2,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import {Badge} from '../../registry/components/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../registry/components/Card';
import {Progress} from '../../registry/components/Progress';
import type {MotionMethods} from '../../registry/motion/contracts';
import {MotionKitStage, ShowcaseTheme} from '../components/MotionKitStage';

const Steps = [
  {
    name: 'enter',
    explanation: 'Fade the panel in as it grows to full size.',
  },
  {
    name: 'emphasize',
    explanation: 'Briefly enlarge the panel and brighten its border.',
  },
  {
    name: 'exit',
    explanation: 'Fade the panel out as it shrinks to 94% of its size.',
  },
];

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
  const panel = createRef<Card>();
  const chart = createRef<Layout>();
  const progress = createSignal(0);
  const phase = createSignal('enter');
  const status = createRef<Badge>();
  const badges = Steps.map(step => ({...step, ref: createRef<Badge>()}));

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
      subtitle="Watch one signal update the label, bar, and curve together."
    >
      <Layout grow={1} gap={theme.spacing.medium}>
        <Card
          ref={panel}
          theme={theme}
          grow={2}
          basis={0}
          minWidth={0}
          opacity={0}
          scale={0.94}
        >
          <CardHeader>
            <CardTitle text="Shared progress" />
            <CardDescription text="The bar's width and the visible curve follow the same progress value." />
          </CardHeader>
          <CardContent grow={1} minHeight={0} gap={theme.spacing.medium}>
            <Layout ref={chart} grow={1} basis={0} minHeight={0}>
              <Line
                layout={false}
                opacity={() => (progress() > 0 ? 1 : 0)}
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
            <Layout direction="column" gap={theme.spacing.small} shrink={0}>
              <Layout justifyContent="space-between">
                <Txt text="Animation progress" fill={theme.colors.muted} />
                <Txt
                  text={() => `${Math.round(progress() * 100)}%`}
                  fill={theme.colors.foreground}
                />
              </Layout>
              <Progress value={() => progress() * 100} theme={theme} />
            </Layout>
          </CardContent>
          <CardFooter justifyContent="space-between" gap={theme.spacing.medium}>
            <Badge
              ref={status}
              text="Ready"
              opacity={0}
              theme={theme}
              variant="secondary"
              alignSelf="center"
            />
            <Txt
              text="The scene controls when these animations run."
              fill={theme.colors.muted}
            />
          </CardFooter>
        </Card>
        <Layout
          direction="column"
          grow={1}
          basis={0}
          minWidth={0}
          gap={theme.spacing.medium}
        >
          {badges.map(({name, explanation, ref}) => (
            <Card
              theme={theme}
              grow={1}
              basis={0}
              minHeight={0}
              stroke={() =>
                phase() === name ? theme.colors.accent : theme.colors.border
              }
            >
              <CardHeader>
                <Badge
                  ref={ref}
                  text={`${name}()`}
                  theme={theme}
                  variant={() => (phase() === name ? 'default' : 'outline')}
                />
              </CardHeader>
              <CardContent grow={1}>
                <Txt
                  text={explanation}
                  textWrap
                  fill={theme.colors.foreground}
                />
              </CardContent>
            </Card>
          ))}
        </Layout>
      </Layout>
    </MotionKitStage>,
  );

  yield* all(
    stage().opacity(1, theme.motion.medium, theme.motion.enter),
    motion.enter(0.6),
    status().enter(),
  );
  yield* waitFor(0.6);
  yield* status().changeText('Animating');
  yield* progress(1, 2.4, theme.motion.emphasize);
  yield* status().changeText({text: 'Complete', variant: 'default'});
  phase('emphasize');
  yield* badges[1].ref().emphasize();
  yield* motion.emphasize();
  yield* waitFor(1);
  yield* status().changeText({text: 'Progress adjusted', variant: 'secondary'});
  yield* progress(0.68, 1.2, theme.motion.emphasize);
  yield* waitFor(2);
  phase('exit');
  yield* badges[2].ref().emphasize();
  yield* motion.exit(0.6);
  yield* waitFor(0.6);
  phase('enter');
  yield* badges[0].ref().emphasize();
  yield* motion.enter(0.6);
  yield* waitFor(3);
  yield* stage().opacity(0, theme.motion.medium, theme.motion.exit);
});
