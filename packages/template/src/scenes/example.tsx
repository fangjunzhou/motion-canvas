import {makeScene2D, Circle, Txt} from '@motion-canvas/2d';
import {
  waitUntil,
  createRef,
  useProperty,
  Vector2,
  all,
  ObjectMetaField,
  NumberMetaField,
  Vector2MetaField,
  StringMetaField,
  waitFor,
  MetaField,
  range,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const circle = createRef<Circle>();

  view.add(
    <Circle ref={circle} width={320} height={320} fill={'lightseagreen'} />,
  );

  yield* waitUntil('circle');
  const keyFrame1 = useProperty(
    new ObjectMetaField('key-frame-1', {
      scale: new NumberMetaField('scale', 100),
      move: new Vector2MetaField('move', new Vector2(500, 0)),
      demoObject: new ObjectMetaField('demoObject', {
        objNumber: new NumberMetaField('objNumber', 3.14),
        objVector: new Vector2MetaField('objVector', new Vector2(3.14, 6.28)),
        nestedObject: new ObjectMetaField('nestedObject', {
          nestedNumber: new NumberMetaField('nestedNumber', 6.28),
        }),
      }),
    }),
  );

  yield* all(
    circle().scale(keyFrame1.scale.get() / 100, 2),
    circle().position(keyFrame1.move.get(), 2),
  );

  const keyFrame2 = useProperty(
    new ObjectMetaField('key-frame-2', {
      scale: new NumberMetaField('scale', 100),
      move: new Vector2MetaField('move', new Vector2(-500, 0)),
    }),
  );
  const keyFrame2_2 = useProperty(
    new ObjectMetaField('key-frame-2.5', {
      scale2: new NumberMetaField('scale', 100),
      move2: new Vector2MetaField('move', new Vector2(-500, 0)),
    }),
  );

  yield* all(
    circle().scale(keyFrame2.scale.get() / 100, 2),
    circle().position(keyFrame2.move.get(), 2),
  );

  const keyFrame3 = useProperty(
    new ObjectMetaField('key-frame-3', {
      text: new StringMetaField('text', 'DEMO TEXT'),
      fontSize: new NumberMetaField('fontSize', 100),
    }),
  );

  const textRef = createRef<Txt>();
  view.add(
    <Txt
      ref={textRef}
      fill={'white'}
      fontSize={keyFrame3.fontSize.get()}
      text={keyFrame3.text.get()}
    />,
  );

  yield* textRef().opacity(0).opacity(1, 1);

  yield* waitFor(1);
});
