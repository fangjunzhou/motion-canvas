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
import cornellBox from '../assets/cornell-box.png';
import stanfordBunny from '../assets/stanford-bunny.png';
import {MotionKitStage, ShowcaseTheme} from '../components/MotionKitStage';

export default makeScene2D(function* (view) {
  const theme = ShowcaseTheme;

  const stage = createRef<MotionKitStage>();
  const card = createRef<Card>();

  view.fill(ShowcaseTheme.colors.background);
  view.add(
    <MotionKitStage
      ref={stage}
      opacity={0}
      size={() => view.size()}
      heading="Card"
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
              text="A ball dips down before it jumps. This small movement in the opposite direction helps the viewer follow the main action."
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
    </MotionKitStage>,
  );

  yield* stage().opacity(
    1,
    ShowcaseTheme.motion.medium,
    ShowcaseTheme.motion.enter,
  );
  yield* card().enter(1.2);
  yield* waitFor(0.8);
  yield* card().showFooter(0.8);
  yield* waitFor(1);
  yield* card().hideFooter(0.8);
  yield* waitFor(0.3);
  yield* card().changeText(
    {
      title: 'Follow-through',
      description: 'Let the movement settle after the main action.',
      content:
        'After a character stops, a loose coat can swing past the body before settling into place. Let that movement finish over a few extra frames. The delay helps the viewer feel the weight of the fabric and keeps the stop from looking abrupt.',
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
      title: 'Graphics test models',
      description: 'Cornell box and Stanford bunny.',
      content: 'Lighting and geometry.',
      footer: 'Cornell: Czerniawskimc (CC0) · Bunny: G1malitm (CC BY-SA 4.0)',
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
  yield* card().changeImage({src: stanfordBunny, width: 560, height: 560}, 1.2);
  yield* waitFor(2);
  yield* stage().opacity(
    0,
    ShowcaseTheme.motion.medium,
    ShowcaseTheme.motion.exit,
  );
});
