import {Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {defaultTheme} from '../registry/foundations/theme';
import {
  colorSwipe,
  flashIn,
  flashOut,
  pushIn,
  pushOut,
  rectTransform,
  textTransform,
} from '../registry/motion/effects';

export default makeScene2D(function* (view) {
  const theme = defaultTheme;
  const first = createRef<Rect>();
  const second = createRef<Rect>();
  const label = createRef<Txt>();
  const next = createRef<Txt>();
  view.fill(theme.colors.background);
  view.add(
    <>
      <Rect
        ref={first}
        position={[-250, 0]}
        size={[320, 200]}
        radius={theme.radius.medium}
        fill={theme.colors.surface}
        opacity={0}
      />
      <Rect
        ref={second}
        position={[250, 0]}
        size={[240, 300]}
        radius={theme.radius.small}
        fill={theme.colors.surface}
        opacity={0}
      />
      <Txt
        ref={label}
        y={-230}
        text="One Frame"
        fontSize={theme.typography.title}
        fill={theme.colors.foreground}
        opacity={0}
      />
      <Txt
        ref={next}
        y={230}
        text="The Next Frame"
        fontSize={theme.typography.heading}
        fill={theme.colors.accent}
        opacity={0}
      />
    </>,
  );
  yield* pushIn(label());
  yield* colorSwipe(first(), {colors: [theme.colors.blue, theme.colors.mauve]});
  yield* flashOut(label());
  yield* flashIn(label());
  yield* rectTransform(first(), second(), {fill: theme.colors.accent});
  yield* textTransform(label(), next());
  yield* waitFor(1);
  yield* pushOut(next(), {offset: [0, -theme.spacing.medium]});
});
