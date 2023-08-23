import {makeScene2D, Circle} from '@motion-canvas/2d';
import {
  waitFor,
  waitUntil,
  createRef,
  useProperty,
  Vector2,
  all,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const circle = createRef<Circle>();

  view.add(
    <Circle ref={circle} width={320} height={320} fill={'lightseagreen'} />,
  );

  yield* waitUntil('circle');
  const keyFrame1 = useProperty('key-frame-1', {
    scale1: 200,
    scale2: 100,
    move1: new Vector2(500, 0),
    move2: new Vector2(-500, 0),
  });
  yield* all(
    circle()
      .scale(keyFrame1.scale1 / 100, 2)
      .to(keyFrame1.scale2 / 100, 2),
    circle().position(keyFrame1.move1, 2).to(keyFrame1.move2, 2),
  );

  yield* waitFor(5);
});
