import {Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../registry/components/Card';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;

  const card = createRef<Card>();

  view.fill(theme.colors.background);
  view.add(
    <Card ref={card} theme={theme} width={720} opacity={0}>
      <CardHeader>
        <CardTitle text="Anticipation" />
        <CardDescription text="Prepare the viewer for the next action." />
      </CardHeader>
      <CardContent>
        <Txt
          textWrap
          text="A ball dips down before it jumps. That small movement prepares the viewer for the jump."
          fill={theme.colors.foreground}
        />
      </CardContent>
      <CardFooter visible={false}>
        <Txt text="Animation principle · 02 / 12" fill={theme.colors.muted} />
      </CardFooter>
    </Card>,
  );

  yield* card().enter(1.2);
  yield* waitFor(0.8);
  yield* card().showFooter(0.8);
  yield* waitFor(1);
  yield* card().hideFooter(0.8);
  yield* waitFor(0.3);
  yield* card().changeText(
    {
      title: 'Follow-Through',
      description: 'Let the movement settle after the main action.',
      content:
        'After a character stops, a loose coat keeps swinging for a few frames. That delay gives the fabric a sense of weight.',
      footer: 'Animation principle · 05 / 12',
      width: 840,
    },
    1.8,
  );
  yield* waitFor(0.6);
  yield* card().showFooter(0.8);
  yield* waitFor(1.8);
});
