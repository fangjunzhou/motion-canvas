import {Layout, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {Highlight} from '../../registry/components/Highlight';
import {ContentSlide} from '../../registry/components/Slide';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const slide = createRef<ContentSlide>();
  const marker = createRef<Highlight>();
  const theme = demoTheme;
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      title="Text Highlight"
      subtitle="Straight and hand-drawn markers."
      {...fitSlide(view)}
      opacity={0}
    >
      <Layout grow={1} justifyContent="center" alignItems="center">
        <Highlight
          ref={marker}
          theme={theme}
          text="A small pause makes the next movement easier to follow."
          selection="small pause"
          width="70%"
          fontSize={theme.typography.heading}
          fontWeight={600}
          color={theme.colors.highlight}
          markerPadding={[0, theme.spacing.small]}
          roughness={2.3}
          bowing={0}
        />
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* marker().reveal();
  yield* waitFor(1);
  yield* marker().erase();
  marker().selection('the next movement easier to follow.');
  yield* marker().reveal();
  yield* waitFor(1.5);
  yield* marker().erase();
  marker().style('hand-drawn');
  marker().selection('small pause');
  yield* marker().reveal();
  yield* waitFor(1.5);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
