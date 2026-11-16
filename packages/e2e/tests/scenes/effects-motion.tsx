import {Layout, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  BBox,
  Color,
  all,
  cancel,
  waitFor,
  type ThreadGenerator,
  type Vector2,
} from '@canvas-commons/core';
import demo from '../../../motion-kit/demo/scenes/motion-kit-effects';
import {Card} from '../../../motion-kit/registry/components/Card';
import {
  colorSwipe,
  rectTransform,
  textTransform,
} from '../../../motion-kit/registry/motion/effects';
import type {EffectsMotionProbe} from './effects-motion.probe';

const Published: {resolve: (probe: EffectsMotionProbe) => void} = {
  resolve: () => {},
};
window.effectsMotionProbe = new Promise(resolve => {
  Published.resolve = resolve;
});
function descendants(node: Node): Node[] {
  return [node, ...node.children().flatMap(descendants)];
}

function paint(node: Node): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Missing effects test canvas.');
  context.translate(400, 300);
  node.render(context);
  return context;
}

function matchesFrame(first: Rect, second: Rect): boolean {
  const before = BBox.fromSizeCentered(first.size()).transformCorners(
    first.localToWorld(),
  );
  const after = BBox.fromSizeCentered(second.size()).transformCorners(
    second.localToWorld(),
  );
  return before.every((point, index) => point.sub(after[index]).magnitude < 1);
}

export default makeScene2D(function* (view) {
  let running = true;
  let sourceSlot: Vector2 | undefined;
  let targetSlot: Vector2 | undefined;
  let stableSlots = true;
  let colorBlock = false;
  let coveredSource = false;
  let coveredTarget = false;
  let sharedLayer = false;
  let titleChanged = false;
  yield* all(
    (function* (): ThreadGenerator {
      yield* demo.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        const nodes = descendants(view);
        const from = nodes.find(
          node => node instanceof Txt && node.text() === 'From One Pose',
        );
        const next = nodes.find(
          node => node instanceof Txt && node.text() === 'To the Next',
        );
        titleChanged ||=
          !!from && !!next && from.opacity() === 0 && next.opacity() === 1;
        const cards = nodes.filter(
          (node): node is Card => node instanceof Card,
        );
        const [source, target] = cards;
        if (!source || !target) throw new Error('Missing effect cards.');
        sourceSlot ??= source.absolutePosition();
        targetSlot ??= target.absolutePosition();
        stableSlots &&=
          source.absolutePosition().equals(sourceSlot) &&
          target.absolutePosition().equals(targetSlot);
        const parent = source.parent()?.parent();
        const overlay = parent
          ?.children()
          .find(
            node =>
              node !== source.parent() &&
              node !== target.parent() &&
              node
                .children()
                .some(
                  child => child instanceof Rect && !(child instanceof Card),
                ),
          );
        const proxy = overlay
          ?.children()
          .find(
            (node): node is Rect =>
              node instanceof Rect && !(node instanceof Card),
          );
        if (proxy) {
          if (proxy.opacity() === 1) {
            const pixel = paint(proxy).getImageData(400, 300, 1, 1).data;
            const expected = new Color(source.theme().colors.accent).rgb();
            colorBlock ||=
              proxy.children().length === 0 &&
              pixel[3] === 255 &&
              expected.every(
                (value, index) => Math.abs(value - pixel[index]) < 1,
              );
            coveredSource ||=
              source.opacity() === 0 &&
              target.opacity() === 0 &&
              matchesFrame(proxy, source);
          }
          coveredTarget ||=
            target.opacity() === 1 &&
            proxy.opacity() > 0.95 &&
            matchesFrame(proxy, target);
          sharedLayer ||=
            !!overlay &&
            !!parent &&
            overlay.parent() === parent &&
            parent.children().indexOf(overlay) >
              parent.children().indexOf(source.parent() ?? source) &&
            parent.children().indexOf(overlay) >
              parent.children().indexOf(target.parent() ?? target);
        }
        yield;
      }
    })(),
  );
  for (const node of view.children()) {
    node.remove();
    node.dispose();
  }

  const group = new Layout({
    layout: true,
    direction: 'column',
    width: 600,
    height: 100,
    opacity: 0,
    children: new Txt({
      width: '100%',
      text: 'Short',
      fontSize: 48,
      fill: 'white',
    }),
  });
  const layer = new Node({children: group});
  view.add(layer);
  const wipe: ThreadGenerator = yield colorSwipe(group, {duration: 1});
  yield* waitFor(0.45);
  const overlay = layer.children()[1];
  const cover = overlay?.children()[0];
  if (!(cover instanceof Rect)) throw new Error('Missing text wipe cover.');
  const glyphWidth = cover.width(),
    allocatedWidth = group.width();
  cancel(wipe);
  const glyphCleanup = layer.children().length === 1 && group.opacity() === 0;
  layer.remove();
  layer.dispose();

  const card = new Card({
    size: [400, 180],
    radius: 32,
    stroke: 'white',
    lineWidth: 8,
    opacity: 0,
  });
  const cardLayer = new Node({children: card});
  view.add(cardLayer);
  const rounded: ThreadGenerator = yield colorSwipe(card, {duration: 1});
  yield* waitFor(0.65);
  const pixels = paint(cardLayer);
  const border = Array.from(pixels.getImageData(598, 300, 1, 1).data);
  const cornerAlpha = pixels.getImageData(599, 211, 1, 1).data[3];
  cancel(rounded);
  const cancelled =
    glyphCleanup && cardLayer.children().length === 1 && card.opacity() === 0;
  cardLayer.remove();
  cardLayer.dispose();

  const from = new Txt({width: 400, text: 'Inherited Type', fill: 'white'});
  const to = new Txt({
    width: 400,
    text: 'Next Type',
    fill: 'white',
    opacity: 0,
  });
  const row = new Layout({
    layout: true,
    size: [1000, 300],
    children: [
      new Layout({fontSize: 60, children: from}),
      new Layout({fontSize: 40, children: to}),
    ],
  });
  view.add(row);
  const transform: ThreadGenerator = yield textTransform(from, to, {
    duration: 1,
  });
  yield* waitFor(0.1);
  const textCopy = row.children().at(-1)?.children()[0];
  const inheritedFont =
    textCopy instanceof Txt &&
    textCopy.fontSize() === from.fontSize() &&
    from.fontSize() === 60;
  cancel(transform);
  const sourceRect = new Rect({
    position: [-160, 0],
    size: [200, 120],
    radius: 20,
    fill: 'red',
    opacity: () => 1,
  });
  const targetRect = new Rect({
    position: [160, 80],
    size: [140, 220],
    fill: 'blue',
    opacity: () => 0,
  });
  const rectLayer = new Node({
    rotation: 15,
    scale: [1.2, 0.8],
    children: [sourceRect, targetRect],
  });
  view.add(rectLayer);
  const sourceBinding = sourceRect.opacity.context.raw();
  const targetBinding = targetRect.opacity.context.raw();
  const rectangle: ThreadGenerator = yield rectTransform(
    sourceRect,
    targetRect,
    {
      duration: 1,
      fill: 'lime',
    },
  );
  yield* waitFor(0.5);
  const rectangleCover = rectLayer.children().at(-1)?.children()[0];
  if (!(rectangleCover instanceof Rect)) {
    throw new Error('Missing rectangle cover.');
  }
  const pixel = paint(rectangleCover).getImageData(400, 300, 1, 1).data;
  const fillOverride =
    pixel[0] === 0 && pixel[1] === 255 && pixel[2] === 0 && pixel[3] === 255;
  cancel(rectangle);
  yield* waitFor(0.05);
  const rectCancelled =
    rectLayer.children().length === 2 &&
    sourceRect.opacity.context.raw() === sourceBinding &&
    targetRect.opacity.context.raw() === targetBinding;
  yield* rectTransform(sourceRect, targetRect, {duration: 0});
  const rectImmediate =
    sourceRect.opacity() === 0 &&
    targetRect.opacity() === 1 &&
    rectLayer.children().length === 2;
  Published.resolve({
    stableSlots,
    colorBlock,
    coveredSource,
    coveredTarget,
    sharedLayer,
    titleChanged,
    glyphWidth,
    allocatedWidth,
    border,
    cornerAlpha,
    cancelled,
    inheritedFont,
    rectCancelled,
    rectImmediate,
    fillOverride,
  });
  yield* waitFor(0.1);
});
