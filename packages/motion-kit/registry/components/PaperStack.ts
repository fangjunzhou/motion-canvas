import {
  Layout,
  initial,
  nodeName,
  signal,
  vector2Signal,
  type LayoutProps,
} from '@canvas-commons/2d';
import {
  Color,
  Vector2,
  all,
  sequence,
  type PossibleVector2,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
  type Vector2Signal,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';
import {Card, type CardProps} from './Card';

/** A declarative stack of PaperStackItem nodes. */
export interface PaperStackProps extends LayoutProps {
  offset?: SignalValue<PossibleVector2>;
  visibleCount?: SignalValue<number>;
  focusIndex?: SignalValue<number>;
  theme?: SignalValue<MotionTheme>;
}
/**
 * A stack of pages with a sliding focus window. Its children remain public nodes.
 * @example
 * ```tsx
 * <PaperStack ref={stack} visibleCount={0}>
 *   <PaperStackItem width={600}><CardImage src={pageOne} /></PaperStackItem>
 *   <PaperStackItem width={600}><CardImage src={pageTwo} /></PaperStackItem>
 * </PaperStack>
 * ```
 */
@nodeName('PaperStack')
export class PaperStack extends Layout {
  @initial([24, 24])
  @vector2Signal('offset')
  declare public readonly offset: Vector2Signal<this>;
  @initial(3)
  @signal()
  declare public readonly visibleCount: SimpleSignal<number, this>;
  @initial(0)
  @signal()
  declare public readonly focusIndex: SimpleSignal<number, this>;
  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;
  public constructor(props: PaperStackProps = {}) {
    super({layoutChildren: false, ...props});
  }
  private items(): PaperStackItem[] {
    return this.children().filter(
      (node): node is PaperStackItem => node instanceof PaperStackItem,
    );
  }
  /**
   * Fade the requested number of pages into the current focus window.
   * @example
   * ```ts
   * yield* stack().show(3);
   * ```
   */
  public *show(
    count: number,
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    yield* this.change(
      Math.max(
        0,
        Math.min(
          this.items().length,
          Math.floor(Number.isFinite(count) ? count : 0),
        ),
      ),
      this.focusIndex(),
      duration,
      easing,
      true,
    );
  }
  /**
   * Move the focus window forward or backward to a zero-based page index.
   * @example
   * ```ts
   * yield* stack().focus(2);
   * ```
   */
  public *focus(
    index: number,
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.emphasize,
  ): ThreadGenerator {
    yield* this.change(
      this.visibleCount(),
      Math.max(
        0,
        Math.min(
          Math.max(0, this.items().length - 1),
          Math.floor(Number.isFinite(index) ? index : 0),
        ),
      ),
      duration,
      easing,
    );
  }
  private *change(
    count: number,
    index: number,
    duration: number,
    easing: TimingFunction,
    stagger = false,
  ): ThreadGenerator {
    const items = this.items();
    for (const item of items.slice(index, index + Math.max(0, count))) {
      yield item;
    }
    const states = items.map(item => ({
      item,
      opacity: item.opacity(),
      raw: item.opacity.context.raw(),
    }));
    const oldCount = this.visibleCount.context.raw(),
      oldFocus = this.focusIndex.context.raw();
    const interval = stagger
      ? Math.min(
          this.theme().motion.short / 2,
          duration / Math.max(1, items.length),
        )
      : 0;
    const fadeTime = duration - interval * Math.max(0, items.length - 1);
    let completed = false;
    try {
      states.forEach(({item, opacity}) => item.opacity(opacity));
      this.visibleCount(count);
      yield* all(
        this.focusIndex(index, duration, easing),
        sequence(
          interval,
          ...states.map(({item}, i) =>
            item.opacity(
              i >= index && i < index + count ? 1 : 0,
              fadeTime,
              easing,
            ),
          ),
        ),
      );
      completed = true;
    } finally {
      if (!completed) {
        if (oldCount === undefined) this.visibleCount.reset();
        else this.visibleCount(oldCount);
        if (oldFocus === undefined) this.focusIndex.reset();
        else this.focusIndex(oldFocus);
      }
      for (const {item, raw} of states) {
        if (raw === undefined) item.opacity.reset();
        else item.opacity(raw);
      }
    }
  }
}

/**
 * A page using the existing Card parts, surface, and image clipping.
 * Each page casts a soft shadow on the pages below it. Native position is an
 * extra offset from its stack slot; native shadow props override the defaults.
 * @example
 * ```tsx
 * <PaperStackItem width={600}><CardHeader><CardTitle text="Page One" /></CardHeader></PaperStackItem>
 * ```
 */
@nodeName('PaperStackItem')
export class PaperStackItem extends Card {
  public constructor(props: CardProps = {}) {
    super({
      layoutSelf: false,
      shadowBlur: 16,
      shadowOffset: [0, 8],
      ...props,
    });
  }
  private placement(): {offset: Vector2; visible: boolean; index: number} {
    const parent = this.parent();
    if (!(parent instanceof PaperStack)) {
      return {offset: Vector2.zero, visible: true, index: 0};
    }
    const index = parent
        .children()
        .filter(node => node instanceof PaperStackItem)
        .indexOf(this),
      focus = parent.focusIndex();
    return {
      offset: parent.offset().scale(index - focus),
      visible:
        index >= Math.round(focus) &&
        index < Math.round(focus) + parent.visibleCount(),
      index,
    };
  }
  protected getDefaultTheme(): MotionTheme {
    const parent = this.parent();
    return parent instanceof PaperStack ? parent.theme() : defaultTheme;
  }
  protected override getX(): number {
    return super.getX() + this.placement().offset.x;
  }
  protected override getY(): number {
    return super.getY() + this.placement().offset.y;
  }
  protected getDefaultOpacity(): number {
    return this.placement().visible ? 1 : 0;
  }
  protected getDefaultZIndex(): number {
    return -this.placement().index;
  }
  protected getDefaultShadowColor(): Color {
    return new Color(this.theme().colors.crust).alpha(0.32);
  }
}
