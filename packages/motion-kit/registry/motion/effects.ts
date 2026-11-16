import {
  Layout,
  Node,
  Rect,
  Txt,
  drawRoundRect,
  type PossibleCanvasStyle,
} from '@canvas-commons/2d';
import {
  BBox,
  Spacing,
  Vector2,
  all,
  createSignal,
  easeInCubic,
  easeOutCubic,
  sequence,
  tween,
  type PossibleVector2,
  type Signal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme} from '../foundations/theme';

/** Timing shared by scene-scheduled effects. Durations use seconds. */
export interface EffectOptions {
  duration?: number;
  easing?: TimingFunction;
}
/** Visual movement relative to the target's resting position. */
export interface PushOptions extends EffectOptions {
  offset?: PossibleVector2;
}
/** A deterministic flicker with frequency in flashes per second. */
export interface FlashOptions {
  duration?: number;
  frequency?: number;
  randomness?: number;
  seed?: number;
}
/** A colored wipe over a target's local bounds. */
export interface ColorSwipeOptions extends EffectOptions {
  layer?: Node;
  direction?: 'horizontal' | 'vertical';
  colors?: PossibleCanvasStyle[];
  interval?: number;
  show?: Node;
  hide?: Node;
}
/** A temporary affine overlay between two existing scene nodes. */
export interface TransformOptions extends EffectOptions {
  layer?: Node;
}
/** Color of the rectangle covering the source-to-target handoff. */
export interface RectTransformOptions extends TransformOptions {
  fill?: PossibleCanvasStyle;
}

function preserve<TSetter, TValue extends TSetter, TOwner>(
  signal: Signal<TSetter, TValue, TOwner>,
): () => void {
  const raw = signal.context.raw();
  return () => {
    if (raw === undefined) signal.reset();
    else signal(raw);
  };
}

function preserveOpacity(node: Node): () => void {
  return preserve(node.opacity);
}

function duration(value: number | undefined, fallback: number): number {
  return value === undefined
    ? fallback
    : Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
}

function* push(
  target: Node,
  enter: boolean,
  options: PushOptions,
): ThreadGenerator {
  const property =
    target instanceof Layout ? target.translate : target.position;
  const restorePosition = preserve(property),
    restoreOpacity = preserveOpacity(target);
  const origin = property();
  const offset = new Vector2(
    options.offset ?? [0, defaultTheme.spacing.medium],
  );
  const time = duration(options.duration, defaultTheme.motion.medium);
  let completed = false;
  try {
    if (enter) {
      property(origin.add(offset));
      target.opacity(0);
    }
    yield* all(
      property(
        enter ? origin : origin.add(offset),
        time,
        options.easing ?? (enter ? easeOutCubic : easeInCubic),
      ),
      target.opacity(enter ? 1 : 0, time),
    );
    completed = true;
  } finally {
    restorePosition();
    if (!completed) restoreOpacity();
  }
}

/**
 * Move and fade a node into its resting position without reflowing its siblings.
 * @example
 * ```ts
 * yield* pushIn(title(), {offset: [0, 40], duration: 0.5});
 * ```
 */
export function* pushIn(
  target: Node,
  options: PushOptions = {},
): ThreadGenerator {
  yield* push(target, true, options);
}
/**
 * Move and fade a node out, then restore its resting position while hidden.
 * @example
 * ```ts
 * yield* pushOut(title(), {offset: [0, -40]});
 * ```
 */
export function* pushOut(
  target: Node,
  options: PushOptions = {},
): ThreadGenerator {
  yield* push(target, false, options);
}

function* flash(
  target: Node,
  visible: boolean,
  options: FlashOptions,
): ThreadGenerator {
  const time = duration(options.duration, defaultTheme.motion.medium);
  const frequency = Number.isFinite(options.frequency ?? 20)
    ? Math.max(1, Math.min(1000, options.frequency ?? 20))
    : 20;
  const randomness = Number.isFinite(options.randomness ?? 0.5)
    ? Math.max(0, Math.min(1, options.randomness ?? 0.5))
    : 0.5;
  const count = Math.max(1, Math.ceil(time * frequency));
  const weights = Array.from({length: count}, (_, i) => {
    const raw =
      Math.sin((options.seed ?? 1) * 127.1 + (i + 1) * 311.7) * 43758.5453;
    return 1 - randomness * (raw - Math.floor(raw)) * 0.95;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  const restore = preserveOpacity(target);
  let completed = false;
  try {
    let boundary = 0;
    const boundaries = weights.map(weight => (boundary += weight / total));
    yield* tween(time, value => {
      const phase = boundaries.findIndex(end => value < end);
      target.opacity(phase % 2 === 0 ? 1 : 0);
    });
    target.opacity(visible ? 1 : 0);
    completed = true;
  } finally {
    if (!completed) restore();
  }
}
/**
 * Flicker into view with a repeatable schedule, without changing layout.
 * @example
 * ```ts
 * yield* flashIn(label(), {frequency: 20, seed: 3});
 * ```
 */
export function* flashIn(
  target: Node,
  options: FlashOptions = {},
): ThreadGenerator {
  yield* flash(target, true, options);
}
/**
 * Flicker out of view with a repeatable schedule.
 * @example
 * ```ts
 * yield* flashOut(label(), {duration: 0.3});
 * ```
 */
export function* flashOut(
  target: Node,
  options: FlashOptions = {},
): ThreadGenerator {
  yield* flash(target, false, options);
}

class Overlay extends Node {
  public readonly matrix = createSignal(new DOMMatrix());
  public maskPath: (() => Path2D) | null = null;
  public override localToParent(): DOMMatrix {
    return this.parentToWorld().inverse().multiply(this.matrix());
  }
  protected override draw(context: CanvasRenderingContext2D): void {
    context.save();
    const path = this.maskPath?.();
    if (path) context.clip(path);
    this.drawChildren(context);
    context.restore();
  }
}

function layerFor(target: Node, layer?: Node): Node {
  const parent = layer ?? target.parent();
  if (!parent) {
    throw new Error(
      'Motion effects require an attached target or an explicit layer.',
    );
  }
  return parent;
}

function matrixLerp(from: DOMMatrix, to: DOMMatrix, value: number): DOMMatrix {
  return new DOMMatrix([
    from.a + (to.a - from.a) * value,
    from.b + (to.b - from.b) * value,
    from.c + (to.c - from.c) * value,
    from.d + (to.d - from.d) * value,
    from.e + (to.e - from.e) * value,
    from.f + (to.f - from.f) * value,
  ]);
}

function contentBounds(target: Node): BBox {
  if (target instanceof Txt) {
    const glyphs = target
      .textGlyphs()
      .filter(glyph => glyph.text.trim() && glyph.width > 0);
    const [first, ...rest] = glyphs.map(
      glyph =>
        new BBox(
          glyph.x - glyph.width / 2,
          glyph.y - glyph.height / 2,
          glyph.width,
          glyph.height,
        ),
    );
    return first
      ? rest.reduce((bounds, box) => bounds.union(box), first)
      : new BBox();
  }
  if (target instanceof Layout && !(target instanceof Rect)) {
    const [first, ...rest] = target
      .children()
      .map(child =>
        BBox.fromPoints(
          ...contentBounds(child).transformCorners(child.localToParent()),
        ),
      );
    if (first) return rest.reduce((bounds, box) => bounds.union(box), first);
  }
  return target instanceof Layout
    ? BBox.fromSizeCentered(target.size())
    : target.cacheBBox();
}

function transformLayer(source: Node, target: Node, layer?: Node): Node {
  if (layer) return layer;
  const ancestors = new Set<Node>();
  let parent = target.parent();
  while (parent) {
    ancestors.add(parent);
    parent = parent.parent();
  }
  parent = source.parent();
  while (parent) {
    if (ancestors.has(parent)) return parent;
    parent = parent.parent();
  }
  return layerFor(source);
}

/**
 * Cover a target with staggered colors, swap visibility, then clear the wipe.
 * The overlay follows the target's full transform, including transformed parents.
 * Set `hide` to the target and omit `show` to wipe it away.
 * @example
 * ```ts
 * yield* colorSwipe(caption(), {colors: ['#89b4fa', '#b4befe']});
 * ```
 */
export function* colorSwipe(
  target: Node,
  options: ColorSwipeOptions = {},
): ThreadGenerator {
  const layer = layerFor(target, options.layer);
  const box = contentBounds(target);
  const overlay = new Overlay({});
  overlay.matrix(() => target.localToWorld());
  if (target instanceof Rect) {
    overlay.maskPath = () => {
      const inset =
        target.stroke() === null ? 0 : Math.max(0, target.lineWidth()) / 2;
      const radius = target.radius();
      const path = new Path2D();
      drawRoundRect(
        path,
        BBox.fromSizeCentered(
          new Vector2(
            Math.max(0, target.width() - inset * 2),
            Math.max(0, target.height() - inset * 2),
          ),
        ),
        new Spacing(
          Math.max(0, radius.top - inset),
          Math.max(0, radius.right - inset),
          Math.max(0, radius.bottom - inset),
          Math.max(0, radius.left - inset),
        ),
        target.smoothCorners(),
        target.cornerSharpness(),
      );
      return path;
    };
  }
  layer.add(overlay);
  const show = options.show ?? (options.hide === target ? undefined : target),
    hide = options.hide;
  const restoreShow = show ? preserve(show.opacity) : () => {},
    restoreHide = hide ? preserve(hide.opacity) : () => {};
  const colors = options.colors?.length
    ? options.colors
    : [defaultTheme.colors.accent];
  const time = duration(options.duration, defaultTheme.motion.long);
  const interval = Math.min(
    duration(options.interval, defaultTheme.motion.short / 2),
    time / (2 * Math.max(1, colors.length)),
  );
  const pass = (time - interval * (colors.length - 1)) / 2;
  const vertical = options.direction === 'vertical';
  const fills = colors.map(fill => new Rect({layoutSelf: false, fill}));
  overlay.add(fills);
  const amounts = fills.map(() => createSignal(0));
  let completed = false;
  for (const [i, rect] of fills.entries()) {
    rect.size(() => [
      box.width * (vertical ? 1 : amounts[i]()),
      box.height * (vertical ? amounts[i]() : 1),
    ]);
    rect.position(() => [
      vertical ? box.center.x : box.x + rect.width() / 2,
      vertical ? box.y + rect.height() / 2 : box.center.y,
    ]);
  }
  try {
    yield* sequence(
      interval,
      ...amounts.map(amount =>
        amount(1, pass, options.easing ?? defaultTheme.motion.enter),
      ),
    );
    show?.opacity(1);
    if (hide && hide !== show) hide.opacity(0);
    fills.forEach(rect =>
      rect.position(() =>
        vertical
          ? [box.center.x, box.bottom - rect.height() / 2]
          : [box.right - rect.width() / 2, box.center.y],
      ),
    );
    yield* all(
      ...amounts.map(amount =>
        amount(0, pass, options.easing ?? defaultTheme.motion.exit),
      ),
    );
    completed = true;
  } finally {
    overlay.remove();
    overlay.dispose();
    if (!completed) {
      restoreShow();
      restoreHide();
    }
  }
}

function* transform(
  source: Rect | Txt,
  target: Rect | Txt,
  options: RectTransformOptions,
  text: boolean,
): ThreadGenerator {
  if (source === target) return;
  const layer = transformLayer(source, target, options.layer);
  const overlay = new Overlay({});
  overlay.matrix(source.localToWorld());
  layer.add(overlay);
  const proxy =
    text && source instanceof Txt
      ? source.clone({
          layoutSelf: false,
          width: source.width(),
          height: source.height(),
          position: Vector2.zero,
          rotation: 0,
          scale: 1,
          skew: Vector2.zero,
          anchor: Vector2.zero,
          translate: Vector2.zero,
          fontFamily: source.fontFamily(),
          fontSize: source.fontSize(),
          fontWeight: source.fontWeight(),
          lineHeight: source.lineHeight(),
          textAlign: source.textAlign(),
          textWrap: source.textWrap(),
        })
      : new Rect({
          layoutSelf: false,
          width: source.width(),
          height: source.height(),
          ...(source instanceof Rect
            ? {
                radius: source.radius(),
                smoothCorners: source.smoothCorners(),
                cornerSharpness: source.cornerSharpness(),
              }
            : {}),
          lineWidth: 0,
          fill: options.fill ?? defaultTheme.colors.accent,
        });
  overlay.add(proxy);
  proxy.opacity(0);
  const restoreSource = preserveOpacity(source),
    restoreTarget = preserveOpacity(target);
  const from = source.localToWorld();
  let completed = false;
  const time = duration(options.duration, defaultTheme.motion.long),
    easing = options.easing ?? defaultTheme.motion.emphasize;
  try {
    target.opacity(0);
    yield* proxy.opacity(1, time * 0.2, easing);
    source.opacity(0);
    const transforms: ThreadGenerator[] = [
      proxy.size(target.size(), time * 0.6, easing),
      tween(time * 0.6, value =>
        overlay.matrix(matrixLerp(from, target.localToWorld(), easing(value))),
      ),
    ];
    if (proxy instanceof Rect && target instanceof Rect) {
      transforms.push(proxy.radius(target.radius(), time * 0.6, easing));
    }
    if (proxy instanceof Txt && target instanceof Txt) {
      transforms.push(
        proxy.fontSize(target.fontSize(), time * 0.6, easing),
        proxy.fontWeight(target.fontWeight(), time * 0.6, easing),
        proxy.text(target.text(), time * 0.6, easing),
        proxy.fill(target.fill(), time * 0.6, easing),
      );
    }
    yield* all(...transforms);
    target.opacity(1);
    yield* proxy.opacity(0, time * 0.2, easing);
    completed = true;
  } finally {
    overlay.remove();
    overlay.dispose();
    if (!completed) {
      restoreSource();
      restoreTarget();
    }
  }
}
/**
 * Cover the source with a color block, morph it to the target, then uncover it.
 * @example
 * ```ts
 * yield* rectTransform(first(), second(), {duration: 1});
 * ```
 */
export function* rectTransform(
  source: Rect,
  target: Rect,
  options: RectTransformOptions = {},
): ThreadGenerator {
  yield* transform(source, target, options, false);
}
/**
 * Morph text, typography, color, dimensions, and affine position between two labels.
 * @example
 * ```ts
 * yield* textTransform(firstLabel(), nextLabel(), {duration: 1});
 * ```
 */
export function* textTransform(
  source: Txt,
  target: Txt,
  options: TransformOptions = {},
): ThreadGenerator {
  yield* transform(source, target, options, true);
}
