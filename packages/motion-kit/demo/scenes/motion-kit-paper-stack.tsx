import {Layout, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  Vector2,
  all,
  createRef,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardImage,
  CardTitle,
} from '../../registry/components/Card';
import {PaperStack, PaperStackItem} from '../../registry/components/PaperStack';
import {RegionHighlight} from '../../registry/components/RegionHighlight';
import {ContentSlide} from '../../registry/components/Slide';
import pageOne from '../assets/attention-is-all-you-need-page-1.png';
import pageTwo from '../assets/attention-is-all-you-need-page-2.png';
import pageThree from '../assets/attention-is-all-you-need-page-3.png';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<ContentSlide>();
  const viewport = createRef<Layout>();
  const stack = createRef<PaperStack>();
  const firstPage = createRef<PaperStackItem>();
  const marker = createRef<RegionHighlight>();
  const pages = [pageOne, pageTwo, pageThree];
  const pageRatio = 612 / 792;
  const pageHeight = () =>
    Math.max(
      0,
      Math.min(
        stack().height() -
          Math.abs(stack().offset().y) * (pages.length - 1) -
          theme.padding.medium * 2,
        (stack().width() -
          Math.abs(stack().offset().x) * (pages.length - 1) -
          theme.padding.medium * 2) /
          pageRatio,
      ),
    );
  const pageWidth = () => pageHeight() * pageRatio;
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      {...fitSlide(view)}
      title="Paper Stack"
      subtitle="Focus a page and mark a passage."
      opacity={0}
    >
      <Layout grow={1} alignItems="center" gap={theme.spacing.large}>
        <Layout
          ref={viewport}
          grow={1}
          basis={0}
          minWidth={0}
          height="100%"
          clip
        >
          <PaperStack
            ref={stack}
            theme={theme}
            layoutSelf={false}
            size={() => viewport().size()}
            visibleCount={0}
            offset={[theme.spacing.medium, theme.spacing.small]}
          >
            {pages.map((src, index) => (
              <PaperStackItem
                ref={index === 0 ? firstPage : undefined}
                position={() =>
                  stack()
                    .offset()
                    .scale(-(pages.length - 1) / 2)
                }
                width={pageWidth}
                height={pageHeight}
                padding={0}
              >
                <CardImage src={src} height="100%" fit="contain">
                  {index === 0 && (
                    <RegionHighlight
                      ref={marker}
                      theme={theme}
                      coordinateSize={[612, 792]}
                      area={{x: 142, y: 456, width: 329, height: 13}}
                    />
                  )}
                </CardImage>
              </PaperStackItem>
            ))}
          </PaperStack>
        </Layout>
        <Card theme={theme} grow={1} basis={0} minWidth={0}>
          <CardHeader>
            <CardTitle text="Attention Is All You Need" />
            <CardDescription text="Vaswani et al. · 2017" />
          </CardHeader>
          <CardContent>
            <Txt
              fill={theme.colors.foreground}
              text="Zoom into a passage, then return to the full page. The highlight stays attached as the page moves."
              textWrap
            />
            <Txt
              fill={theme.colors.muted}
              fontSize={theme.typography.caption}
              text="arXiv:1706.03762 · Pages 1-3"
            />
          </CardContent>
        </Card>
      </Layout>
    </ContentSlide>,
  );
  function* highlightPassage(): ThreadGenerator {
    const bounds = marker().bounds();
    const center = bounds.center
      .transformAsPoint(firstPage().localToWorld())
      .transformAsPoint(stack().worldToLocal());
    const zoom = Math.max(
      1,
      Math.min(
        (viewport().width() - theme.padding.large * 2) / bounds.width,
        (viewport().height() - theme.padding.large * 2) / bounds.height,
      ),
    );
    yield* all(
      stack().scale(zoom, theme.motion.long, theme.motion.emphasize),
      stack().translate(
        center.flipped,
        theme.motion.long,
        theme.motion.emphasize,
      ),
    );
    yield* marker().reveal();
    yield* waitFor(1.5);
    yield* marker().erase();
    yield* all(
      stack().scale(1, theme.motion.long, theme.motion.emphasize),
      stack().translate(
        Vector2.zero,
        theme.motion.long,
        theme.motion.emphasize,
      ),
    );
  }
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* stack().show(3);
  yield* waitFor(theme.motion.long);
  yield* highlightPassage();
  yield* stack().focus(1);
  yield* waitFor(1.5);
  yield* stack().focus(2);
  yield* waitFor(1.5);
  yield* stack().focus(0);
  yield* highlightPassage();
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
