import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {Highlight} from '../registry/components/Highlight';
import {catppuccinThemes} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const marker = createRef<Highlight>();
  const theme = catppuccinThemes.latte;
  view.fill(theme.colors.background);
  view.add(
    <Highlight
      ref={marker}
      theme={theme}
      text="A truly remarkable end to the World Cup"
      selection="remarkable"
      width={1000}
      fontSize={80}
      fontWeight={700}
      color="rgba(255, 236, 79, 0.62)"
      markerPadding={[0, 20]}
      maxRandomnessOffset={10}
      roughness={2.3}
      bowing={0}
    />,
  );
  yield* marker().reveal();
  yield* waitFor(1);
  yield* marker().erase();
  marker().selection('remarkable end to the World Cup');
  yield* marker().reveal();
  yield* waitFor(1);
  yield* marker().erase();
  marker().style('hand-drawn');
  marker().selection('remarkable');
  yield* marker().reveal();
  yield* waitFor(1);
});
