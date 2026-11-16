import {Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {RegionHighlight} from '../registry/components/RegionHighlight';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const marker = createRef<RegionHighlight>();
  const theme = defaultTheme;
  view.fill(theme.colors.background);
  view.add(
    <Rect
      size={[1000, 440]}
      radius={theme.radius.medium}
      fill={theme.colors.surface}
    >
      <Txt
        text="Hold the pose for a few frames."
        fontSize={theme.typography.body}
        fill={theme.colors.foreground}
      />
      <RegionHighlight
        ref={marker}
        coordinateSize={[1000, 440]}
        area={{x: 330, y: 185, width: 240, height: 70}}
      />
    </Rect>,
  );
  yield* marker().reveal();
  yield* waitFor(1);
  yield* marker().erase();
  marker().area({x: 590, y: 185, width: 310, height: 70});
  yield* marker().reveal();
  yield* waitFor(1);
});
