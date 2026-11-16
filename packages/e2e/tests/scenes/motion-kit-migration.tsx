import {Layout, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  Vector2,
  all,
  cancel,
  createSignal,
  usePlayback,
  useThread,
  waitFor,
  type ThreadGenerator,
} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../motion-kit/registry/components/Card';
import {
  Chart,
  ChartAxis,
  ChartLine,
} from '../../../motion-kit/registry/components/Chart';
import {
  PaperStack,
  PaperStackItem,
} from '../../../motion-kit/registry/components/PaperStack';
import {RegionHighlight} from '../../../motion-kit/registry/components/RegionHighlight';
import {
  BlankSlide,
  ContentSlide,
  TitleSlide,
} from '../../../motion-kit/registry/components/Slide';
import {createTheme} from '../../../motion-kit/registry/foundations/theme';
import {
  colorSwipe,
  flashIn,
  flashOut,
  pushIn,
  pushOut,
  rectTransform,
  textTransform,
} from '../../../motion-kit/registry/motion/effects';
import type {MigrationProbe} from './motion-kit-migration.probe';

const Published: {resolve: (probe: MigrationProbe) => void} = {
  resolve: () => {},
};
window.migrationProbe = new Promise(resolve => {
  Published.resolve = resolve;
});

function* sample(
  animation: ThreadGenerator,
  read: () => void,
): ThreadGenerator {
  let running = true;
  yield* all(
    (function* (): ThreadGenerator {
      yield* animation;
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        read();
        yield;
      }
    })(),
  );
}
function paint(node: Node): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Missing test canvas.');
  context.translate(400, 300);
  node.render(context);
  return context;
}

function hasWipe(part: Node): boolean {
  const position = part.localToWorld();
  return (
    part
      .parent()
      ?.children()
      .some(node => {
        if (
          node === part ||
          !node
            .children()
            .some(child => child instanceof Rect && child.width() > 0)
        ) {
          return false;
        }
        const matrix = node.localToWorld();
        return (
          Math.abs(matrix.e - position.e) < 0.001 &&
          Math.abs(matrix.f - position.f) < 0.001
        );
      }) ?? false
  );
}

function* sampleSwipeStarts(
  parts: Node[],
  animation: ThreadGenerator,
  starts: number[],
): ThreadGenerator {
  const started = useThread().time();
  yield* sample(animation, () => {
    parts.forEach((part, index) => {
      if (starts[index] < 0 && hasWipe(part)) {
        starts[index] = useThread().time() - started;
      }
    });
  });
}

export default makeScene2D(function* (view) {
  const row = new Layout({
    layout: true,
    gap: 32,
    children: [new Txt({text: 'First'}), new Txt({text: 'Next'})],
  });
  view.add(row);
  const [label, sibling] = row.children();
  const resting = label.absolutePosition(),
    nextResting = sibling.absolutePosition();
  const binding = label.opacity.context.raw();
  let stable = true;
  yield* sample(pushIn(label, {duration: 0.3}), () => {
    stable &&= sibling.absolutePosition().equals(nextResting);
  });
  const pushStable = stable && label.absolutePosition().equals(resting);
  yield* pushOut(label, {duration: 0});
  const out = label.opacity() === 0 && label.absolutePosition().equals(resting);
  label.opacity(binding ?? 1);
  const animation: ThreadGenerator = yield pushIn(label, {duration: 1});
  yield* waitFor(0.2);
  cancel(animation);
  const pushBinding =
    out &&
    label.opacity.context.raw() === binding &&
    label.absolutePosition().equals(resting);
  const runs: number[][] = [];
  const flashFrames = Math.round(0.5 * usePlayback().fps);
  for (let i = 0; i < 2; i++) {
    const values: number[] = [];
    yield* sample(flashIn(label, {duration: 0.5, seed: 19}), () => {
      if (values.length < flashFrames) values.push(label.opacity());
    });
    runs.push(values);
  }
  yield* flashOut(label, {duration: 0});
  const flashHidden = label.opacity() === 0;
  row.remove();

  const parent = new Node({
    position: [70, 50],
    rotation: 25,
    scale: [1.2, 0.7],
  });
  const source = new Rect({position: [-100, 0], size: [200, 100], fill: 'red'});
  const target = new Rect({
    position: [200, 100],
    size: [100, 250],
    radius: 20,
    fill: 'blue',
    opacity: 0,
  });
  parent.add([source, target]);
  view.add(parent);
  const layer = new Node({position: [-50, 40], rotation: -15});
  view.add(layer);
  source.opacity(0);
  const wipe: ThreadGenerator = yield colorSwipe(source, {
    duration: 0.4,
    colors: ['red', 'blue'],
    layer,
  });
  yield* waitFor(0.1);
  const overlay = layer.children()[0];
  const a = overlay.localToWorld(),
    b = source.localToWorld();
  const wipeMapped = ['a', 'b', 'c', 'd', 'e', 'f'].every(
    key => Math.abs(Reflect.get(a, key) - Reflect.get(b, key)) < 0.001,
  );
  yield* waitFor(0.4);
  const wipeClean = source.opacity() === 1 && layer.children().length === 0;
  cancel(wipe);
  source.opacity(0);
  const interrupted: ThreadGenerator = yield colorSwipe(source, {
    duration: 1,
    layer,
  });
  yield* waitFor(0.1);
  cancel(interrupted);
  let cancelClean = layer.children().length === 0 && source.opacity() === 0;
  source.opacity(1);
  const morph: ThreadGenerator = yield rectTransform(source, target, {
    duration: 1,
    layer,
  });
  yield* waitFor(0.3);
  cancel(morph);
  cancelClean &&=
    layer.children().length === 0 &&
    source.opacity() === 1 &&
    target.opacity() === 0;
  yield* rectTransform(source, target, {duration: 0.4, layer});
  const morphFinal =
    source.opacity() === 0 &&
    target.opacity() === 1 &&
    layer.children().length === 0;
  const from = new Txt({text: 'First Frame', fontSize: 40, fill: 'red'});
  const to = new Txt({
    text: 'Next Frame',
    position: [80, 60],
    fontSize: 60,
    fill: 'blue',
    opacity: 0,
  });
  parent.add(from);
  layer.add(to);
  yield* textTransform(from, to, {duration: 0.4, layer});
  const textFinal =
    from.opacity() === 0 && to.opacity() === 1 && layer.children().length === 1;
  yield* colorSwipe(target, {duration: 0, direction: 'vertical'});
  parent.remove();
  layer.remove();

  const frame = new Rect({size: [400, 200]});
  const region = new RegionHighlight({
    coordinateSize: [1000, 500],
    area: {x: 100, y: 50, width: 500, height: 100},
  });
  frame.add(region);
  view.add(frame);
  const bounds = region.bounds();
  const regionMapped =
    bounds.x === -160 &&
    bounds.y === -80 &&
    bounds.width === 200 &&
    bounds.height === 40;
  frame.size([800, 400]);
  yield* region.reveal(0);
  const regionResponsive =
    region.bounds().width === 400 &&
    region.bounds().x === -320 &&
    region.progress() === 1;
  frame.remove();

  const stack = new PaperStack({visibleCount: 0, offset: [30, 20]});
  const pages = [0, 1, 2].map(
    () => new PaperStackItem({size: [300, 200], fill: 'white'}),
  );
  stack.add(pages);
  view.add(stack);
  yield* stack.show(2, 0.2);
  const shadowPixel = paint(stack).getImageData(400, 406, 1, 1).data;
  const blur = pages[0].shadowBlur();
  const shadowOffset = pages[0].shadowOffset();
  pages[0].shadowBlur(0);
  pages[0].shadowOffset(0);
  const plainPixel = paint(stack).getImageData(400, 406, 1, 1).data;
  const stackShadow = shadowPixel[0] < plainPixel[0] - 5;
  const stackShadowOverride =
    plainPixel[0] === 255 && plainPixel[1] === 255 && plainPixel[2] === 255;
  pages[0].shadowBlur(blur);
  pages[0].shadowOffset(shadowOffset);
  yield* stack.focus(1, 0.2);
  const stackWindow =
    pages[0].opacity() === 0 &&
    pages[1].opacity() === 1 &&
    pages[2].opacity() === 1 &&
    pages[1].position().equals(Vector2.zero) &&
    pages[2].position().equals(new Vector2(30, 20));
  yield* stack.focus(0, 0);
  const stackBackward =
    pages[0].opacity() === 1 &&
    pages[2].opacity() === 0 &&
    pages[1].position().equals(new Vector2(30, 20));
  const copied = stack.clone({offset: [50, 40], focusIndex: 1});
  view.add(copied);
  stack.theme(createTheme({flavor: 'latte'}));
  const stackClone =
    copied.children()[1].position().equals(Vector2.zero) &&
    stack.children()[1].position().equals(new Vector2(30, 20)) &&
    pages[0].theme().colors.background === stack.theme().colors.background &&
    pages[0].shadowColor().serialize() !==
      copied.children()[0].shadowColor().serialize() &&
    copied
      .children()
      .every(
        node =>
          node instanceof Card &&
          node.theme().colors.background !== stack.theme().colors.background,
      );
  const focus: ThreadGenerator = yield stack.focus(2, 1);
  yield* waitFor(0.2);
  cancel(focus);
  cancelClean &&=
    stack.focusIndex() === 0 &&
    stack.visibleCount() === 2 &&
    pages[0].opacity() === 1;
  stack.remove();
  copied.remove();

  const range = createSignal<readonly [number, number]>([0, 10]);
  const chart = new Chart({size: [400, 200], xRange: range, yRange: [-1, 1]});
  const axis = new ChartAxis({
    ticks: [{value: -1}, {value: 0, label: 'Start'}, {value: 10}, {value: 11}],
  });
  const series = new ChartLine({
    data: [
      [0, -1],
      [5, 0],
      [10, 1],
    ],
    end: 0,
  });
  chart.add([axis, series]);
  view.add(chart);
  const chartMapped =
    chart.point(0, -1).equals(new Vector2(-200, 100)) &&
    chart.point(10, 1).equals(new Vector2(200, -100)) &&
    series.parsedPoints()[1].equals(Vector2.zero);
  const chartTicks =
    axis.tickValues().length === 2 && axis.tickValues()[0].label === 'Start';
  range([0, 20]);
  const chartReactive = series.parsedPoints()[2].x === 0;
  const chartCopy = chart.clone({
    theme: createTheme({colors: {accent: '#123456'}}),
  });
  view.add(chartCopy);
  const copiedLine = chartCopy.children().find(n => n instanceof ChartLine);
  const chartClone =
    !!copiedLine &&
    copiedLine.stroke()?.toString() !== series.stroke()?.toString();
  const zeroLine = paint(series)
    .getImageData(0, 0, 800, 600)
    .data.every(value => value === 0);
  axis.opacity(0);
  range([0, 10]);
  series.end(1);
  series.data([
    [-5, 0],
    [15, 0],
  ]);
  const pixels = paint(chart);
  const clippedLine =
    pixels.getImageData(400, 300, 1, 1).data[3] > 0 &&
    pixels.getImageData(150, 300, 1, 1).data[3] === 0;
  chart.xRange([1, 1]);
  const chartInvalid =
    !chart.valid() &&
    chart.point(5, 0).equals(Vector2.zero) &&
    series.parsedPoints().length === 0 &&
    axis.tickValues().length === 0;
  chart.remove();
  chartCopy.remove();

  const cardTitle = new CardTitle({text: 'One Frame'});
  const cardDescription = new CardDescription({text: 'A shared surface.'});
  const cardContent = new CardContent({children: new Txt({text: 'Content'})});
  const card = new Card({
    width: 500,
    opacity: 0,
    children: [
      new CardHeader({children: [cardTitle, cardDescription]}),
      cardContent,
    ],
  });
  view.add(card);
  const size = card.size();
  const cardSwipeOrder = [-1, -1, -1];
  yield* sampleSwipeStarts(
    [cardTitle, cardDescription, cardContent],
    card.swipeIn(0.8),
    cardSwipeOrder,
  );
  const cardWipe =
    card.opacity() === 1 &&
    card.size().equals(size) &&
    card.children()[0].children()[0].opacity() === 1 &&
    view.children().length === 1;
  card.remove();
  const slide = new TitleSlide({
    title: 'Title',
    subtitle: 'Subtitle',
    opacity: 0,
  });
  view.add(slide);
  const headings = slide.children()[0].children();
  let staged = false;
  yield* sample(slide.enter(0.6), () => {
    staged ||= headings[0].opacity() === 1 && headings[1].opacity() === 0;
  });
  const slideStaged =
    staged &&
    slide.opacity() === 1 &&
    headings.every(n => n.opacity() === 1) &&
    headings.every(
      n => n instanceof Layout && n.translate().equals(Vector2.zero),
    );
  const headingPositions = headings.map(node => node.absolutePosition());
  const headingBindings = headings.map(node => node.opacity.context.raw());
  let covered = false;
  let staggered = false;
  let stationary = true;
  yield* sample(slide.swipeOut(0.6), () => {
    const covers = slide
      .children()[0]
      .children()
      .filter(node => !headings.includes(node))
      .flatMap(node => node.children());
    staggered ||=
      covers.length === 1 &&
      covers[0] instanceof Rect &&
      covers[0].width() > 0 &&
      headings.every(node => node.opacity() === 1);
    covered ||=
      headings.every(node => node.opacity() === 0) &&
      covers.filter(node => node instanceof Rect && node.width() > 0).length ===
        2;
    stationary &&= headings.every((node, index) =>
      node.absolutePosition().equals(headingPositions[index]),
    );
  });
  const slideWiped =
    covered &&
    staggered &&
    stationary &&
    slide.opacity() === 0 &&
    slide.children()[0].children().length === headings.length &&
    headings.every(
      (node, index) => node.opacity.context.raw() === headingBindings[index],
    );
  yield* slide.enter(0);
  const replayVisible =
    slide.opacity() === 1 && headings.every(node => node.opacity() === 1);
  yield* slide.swipeOut(0);
  const slideReplay = replayVisible && slide.opacity() === 0;
  yield* slide.enter(0);
  const exit: ThreadGenerator = yield slide.swipeOut(1);
  yield* waitFor(0.5);
  cancel(exit);
  yield* waitFor(0.05);
  const slideCancelled =
    slide.opacity() === 1 &&
    slide.children()[0].children().length === headings.length &&
    headings.every(
      (node, index) => node.opacity.context.raw() === headingBindings[index],
    );
  slide.remove();
  const contentSlide = new ContentSlide({
    title: 'Title',
    subtitle: 'Subtitle',
    children: new Rect({size: [200, 100], fill: 'white'}),
  });
  view.add(contentSlide);
  const parts = [
    ...contentSlide.children()[0].children(),
    contentSlide.children()[1],
  ];
  const partBindings = parts.map(part => part.opacity.context.raw());
  const slideOrder = [-1, -1, -1];
  yield* sampleSwipeStarts(parts, contentSlide.swipeOut(0.8), slideOrder);
  const slideEnterOrder = [-1, -1, -1];
  yield* sampleSwipeStarts(parts, contentSlide.swipeIn(0.8), slideEnterOrder);
  let slideSwipeIn =
    contentSlide.opacity() === 1 && parts.every(part => part.opacity() === 1);
  yield* contentSlide.swipeOut(0);
  const entrance: ThreadGenerator = yield contentSlide.swipeIn(1);
  yield* waitFor(0.5);
  cancel(entrance);
  yield* waitFor(0.05);
  const slideEnterCancelled =
    contentSlide.opacity() === 0 &&
    contentSlide.children().length === 2 &&
    contentSlide.children()[0].children().length === 2 &&
    parts.every(
      (part, index) => part.opacity.context.raw() === partBindings[index],
    );
  contentSlide.remove();
  const blank = new BlankSlide({
    children: new Rect({size: 200, fill: 'white'}),
  });
  view.add(blank);
  yield* blank.swipeOut(0);
  const blankSlideExit = blank.opacity() === 0 && blank.children().length === 2;
  yield* blank.swipeIn(0);
  slideSwipeIn &&= blank.opacity() === 1;
  Published.resolve({
    pushStable,
    pushBinding,
    flashOut: flashHidden,
    flashRuns: runs,
    wipeMapped,
    wipeClean,
    cancelClean,
    morphFinal,
    textFinal,
    regionMapped,
    regionResponsive,
    stackWindow,
    stackBackward,
    stackClone,
    stackShadow,
    stackShadowOverride,
    chartMapped,
    chartReactive,
    chartTicks,
    chartInvalid,
    chartClone,
    zeroLine,
    clippedLine,
    cardWipe,
    cardSwipeOrder,
    slideStaged,
    slideWiped,
    slideReplay,
    slideCancelled,
    slideOrder,
    slideEnterOrder,
    slideSwipeIn,
    slideEnterCancelled,
    blankSlideExit,
  });
  yield* waitFor(0.1);
});
