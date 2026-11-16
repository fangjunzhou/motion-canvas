import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {InkArrow} from '../registry/components/InkArrow';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const arrow = createRef<InkArrow>();
  view.fill(defaultTheme.colors.background);
  view.add(
    <InkArrow
      ref={arrow}
      from={[-300, 80]}
      to={[300, -80]}
      strokeWidth={12}
      headSize={36}
    />,
  );
  yield* arrow().reveal();
  yield* waitFor(1);
  yield* arrow().erase();
  arrow().curvature(-0.35);
  arrow().seed('another-arrow');
  yield* arrow().reveal();
  yield* waitFor(1);
});
