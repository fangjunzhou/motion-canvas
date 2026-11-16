import {Img, Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {Vector2, all, createRef, waitFor} from '@canvas-commons/core';
import {transformerPaperPage} from '../registry/assets/transformer-paper';
import {RegionHighlight} from '../registry/components/RegionHighlight';
import {defaultTheme} from '../registry/foundations/theme';

export default makeScene2D(function* (view) {
  const marker = createRef<RegionHighlight>();
  const page = createRef<Img>();
  const caption = createRef<Txt>();
  const theme = defaultTheme;
  view.fill(theme.colors.background);
  view.add(
    <Layout layout width={1600} alignItems="center" gap={96}>
      <Rect size={[680, 880]} clip>
        <Img ref={page} src={transformerPaperPage} size={[680, 880]}>
          <RegionHighlight
            ref={marker}
            coordinateSize={[612, 792]}
            area={{x: 209, y: 147, width: 194, height: 19}}
            opacity={0.3}
          />
        </Img>
      </Rect>
      <Layout
        direction="column"
        grow={1}
        basis={0}
        minWidth={0}
        gap={theme.spacing.medium}
        fontFamily={theme.typography.fontFamily}
      >
        <Txt
          text="Attention Is All You Need"
          textWrap
          fontSize={theme.typography.heading}
          fill={theme.colors.foreground}
        />
        <Txt
          text="Vaswani et al. (2017)"
          fontSize={theme.typography.body}
          fill={theme.colors.muted}
        />
        <Txt
          ref={caption}
          text="Mark the title in page coordinates."
          textWrap
          fontSize={theme.typography.body}
          fill={theme.colors.foreground}
        />
        <Txt
          text="arXiv:1706.03762v7 - Page 1"
          fontSize={theme.typography.caption}
          fill={theme.colors.muted}
        />
      </Layout>
    </Layout>,
  );
  yield page().toPromise();
  yield* marker().reveal();
  yield* waitFor(1);
  yield* marker().erase();
  marker().area({x: 142, y: 411, width: 330, height: 166});
  const center = marker().bounds().center;
  yield* all(
    page().scale(1.7, theme.motion.long),
    page().position(center.scale(-1.7), theme.motion.long),
    caption().text(
      'Zoom into the abstract. The marker stays attached to the page.',
      theme.motion.long,
    ),
  );
  yield* marker().reveal();
  yield* waitFor(2);
  yield* all(
    page().scale(1, theme.motion.long),
    page().position(Vector2.zero, theme.motion.long),
  );
  yield* waitFor(1.5);
});
