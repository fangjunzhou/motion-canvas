import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardImage,
  CardTitle,
} from '../../registry/components/Card';
import {ContentSlide} from '../../registry/components/Slide';
import {defaultTheme} from '../../registry/foundations/theme';
import cornellBox from '../assets/cornell-box.png';
import stanfordBunny from '../assets/stanford-bunny.png';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;

  const stage = createRef<ContentSlide>();
  const card = createRef<Card>();

  view.fill(defaultTheme.colors.background);
  view.add(
    <ContentSlide
      ref={stage}
      opacity={0}
      size={() => view.size()}
      title="Card"
      subtitle="Use a card to group related information in a scene."
    >
      <Layout grow={1} alignItems="center" justifyContent="center">
        <Card ref={card} theme={theme} width={720} opacity={0}>
          <CardImage
            src={cornellBox}
            height={440}
            fit="cover"
            visible={false}
          />
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
            <Txt
              text="Animation principle · 02 / 12"
              fill={theme.colors.muted}
            />
          </CardFooter>
        </Card>
      </Layout>
    </ContentSlide>,
  );

  yield* stage().opacity(
    1,
    defaultTheme.motion.medium,
    defaultTheme.motion.enter,
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
  yield* card().hideFooter(0.6);
  yield* card().changeText(
    {
      title: 'Test Models',
      description: 'Cornell box',
      content: '',
      footer: 'Cornell: CC0 · Bunny: G1malitm · CC BY-SA 4.0',
    },
    1.2,
  );
  yield* card().showImage(0.8);
  yield* card().showFooter(0.6);
  yield* waitFor(1.8);
  yield* card().hideImage(0.8);
  yield* waitFor(0.6);
  yield* card().showImage(0.8);
  yield* waitFor(1);
  yield* card().hideFooter(0.6);
  yield* card().changeImage(
    {
      src: stanfordBunny,
      width: 560,
      height: 560,
      description: 'Stanford bunny',
    },
    1.2,
  );
  yield* waitFor(2);
  yield* stage().opacity(
    0,
    defaultTheme.motion.medium,
    defaultTheme.motion.exit,
  );
});
