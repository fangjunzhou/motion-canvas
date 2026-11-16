import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../registry/components/Card';
import {ContentSlide} from '../../registry/components/Slide';
import {
  colorSwipe,
  flashIn,
  flashOut,
  pushIn,
  pushOut,
  rectTransform,
} from '../../registry/motion/effects';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<ContentSlide>();
  const first = createRef<Card>();
  const second = createRef<Card>();
  const label = createRef<Txt>();
  const next = createRef<Txt>();
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      {...fitSlide(view)}
      title="Motion Effects"
      subtitle="Build a transition from a few scene effects."
      opacity={0}
    >
      <Layout grow={1} alignItems="center" gap={theme.spacing.large}>
        <Layout
          grow={1}
          basis={0}
          minWidth={0}
          direction="column"
          gap={theme.spacing.medium}
        >
          <Txt
            ref={label}
            width="100%"
            textAlign="center"
            textWrap
            text="From One Pose"
            fill={theme.colors.foreground}
            opacity={0}
          />
          <Card ref={first} theme={theme} width="100%" opacity={0}>
            <CardHeader>
              <CardTitle text="First Pose" />
              <CardDescription text="Establish the starting point." />
            </CardHeader>
            <CardContent>
              <Txt
                fill={theme.colors.foreground}
                text="A color wipe reveals the card and its text in order."
                textWrap
              />
            </CardContent>
          </Card>
        </Layout>
        <Layout
          grow={1}
          basis={0}
          minWidth={0}
          direction="column"
          gap={theme.spacing.medium}
        >
          <Txt
            ref={next}
            width="100%"
            textAlign="center"
            textWrap
            text="To the Next"
            fill={theme.colors.accent}
            opacity={0}
          />
          <Card ref={second} theme={theme} width="100%" opacity={0}>
            <CardHeader>
              <CardTitle text="Next Pose" />
              <CardDescription text="Give the motion somewhere to go." />
            </CardHeader>
            <CardContent>
              <Txt
                fill={theme.colors.foreground}
                text="A color block covers the card, moves into place, then reveals the next pose."
                textWrap
              />
            </CardContent>
          </Card>
        </Layout>
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* pushIn(label(), {
    duration: theme.motion.medium,
    easing: theme.motion.enter,
    offset: [0, theme.spacing.medium],
  });
  yield* colorSwipe(first(), {
    duration: theme.motion.long * 2,
    colors: [theme.colors.accent],
  });
  yield* waitFor(theme.motion.medium);
  yield* flashOut(label(), {duration: theme.motion.medium});
  yield* rectTransform(first(), second(), {
    fill: theme.colors.accent,
    duration: theme.motion.long,
    easing: theme.motion.emphasize,
  });
  yield* flashIn(next(), {duration: theme.motion.medium});
  yield* waitFor(1.5);
  yield* pushOut(next(), {
    duration: theme.motion.medium,
    easing: theme.motion.exit,
    offset: [0, theme.spacing.medium],
  });
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
