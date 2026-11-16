import {
  Rect,
  Txt,
  initial,
  nodeName,
  signal,
  type NodeState,
  type RectProps,
} from '@canvas-commons/2d';
import {
  type Signal,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Visual variants from the shadcn/ui Badge API. */
export type BadgeVariant =
  'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

/** Native layout and shape props, plus reactive label, variant, and theme. */
export interface BadgeProps extends RectProps {
  text?: SignalValue<string>;
  variant?: SignalValue<BadgeVariant>;
  theme?: SignalValue<MotionTheme>;
  textColor?: SignalValue<string>;
}

/** A label replacement with an optional visual variant. */
export interface BadgeUpdate {
  text: string;
  variant?: BadgeVariant;
}

function preserve<TSetter, TValue extends TSetter, TOwner>(
  property: Signal<TSetter, TValue, TOwner>,
): () => void {
  const value = property.context.raw();
  return () => {
    if (value === undefined) property.reset();
    else property(value);
  };
}

/**
 * A compact label with optional native children before its text, such as an icon.
 *
 * @example
 * ```tsx
 * <Badge text={() => status()} variant="secondary" />
 * ```
 */
@nodeName('Badge')
export class Badge extends Rect {
  @initial('')
  @signal()
  declare public readonly text: SimpleSignal<string, this>;

  @initial('default')
  @signal()
  declare public readonly variant: SimpleSignal<BadgeVariant, this>;

  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  /** Override the label color without changing the background fill. */
  @signal()
  declare public readonly textColor: SimpleSignal<string, this>;

  private readonly label: Txt;

  public constructor({children, ...props}: BadgeProps = {}) {
    super({
      layout: true,
      direction: 'row',
      alignItems: 'center',
      alignSelf: 'start',
      shrink: 0,
      padding: [4, 12],
      gap: 6,
      lineWidth: 2,
      children,
      ...props,
    });
    this.label = new Txt({
      text: () => this.text(),
      fill: () => this.textColor(),
      textWrap: false,
    });
    this.add(this.label);
  }

  /**
   * Clone the badge with a new label bound to the copy's own signals.
   *
   * @example
   * ```ts
   * const copy = badge.clone({text: 'Complete'});
   * ```
   */
  public override clone(props: NodeState = {}): this {
    return super.clone({
      children: this.children()
        .filter(child => child !== this.label)
        .map(child => child.clone()),
      ...props,
    });
  }

  /**
   * Fade in the badge. Repeating this method replays the fade.
   * @example
   * ```ts
   * yield* badge().enter(0.3);
   * ```
   */
  public *enter(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    this.opacity(0);
    yield* this.opacity(1, duration, easing);
  }

  /**
   * Fade out while keeping the badge's layout space.
   * @example
   * ```ts
   * yield* badge().exit(0.3);
   * ```
   */
  public *exit(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    yield* this.opacity(0, duration, easing);
  }

  /**
   * Pulse the badge and restore its original scale binding.
   * @example
   * ```ts
   * yield* badge().emphasize(0.4);
   * ```
   */
  public *emphasize(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.emphasize,
  ): ThreadGenerator {
    const restore = preserve(this.scale);
    const scale = this.scale();
    try {
      yield* this.scale(scale.scale(1.12), duration / 2, easing);
      yield* this.scale(scale, duration / 2, easing);
    } finally {
      restore();
    }
  }

  /**
   * Fade the label out, resize its width, replace its text and variant, then fade it in.
   * An explicit replacement changes the text binding. Width and label opacity
   * bindings are restored when finished or cancelled.
   * @example
   * ```ts
   * yield* badge().changeText({text: 'Complete', variant: 'default'}, 0.5);
   * ```
   */
  public *changeText(
    update: string | BadgeUpdate,
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.emphasize,
  ): ThreadGenerator {
    const value = typeof update === 'string' ? {text: update} : update;
    const restoreWidth = preserve(this.width);
    const restoreOpacity = preserve(this.label.opacity);
    const opacity = this.label.opacity();
    const before = this.width();
    const probe = this.clone({text: value.text});
    const after = probe.width();
    probe.dispose();
    try {
      yield* this.label.opacity(0, duration * 0.25, easing);
      this.width(before);
      yield* this.width(after, duration * 0.5, easing);
      this.text(value.text);
      if (value.variant !== undefined) this.variant(value.variant);
      restoreWidth();
      yield* this.label.opacity(opacity, duration * 0.25, easing);
    } finally {
      restoreWidth();
      restoreOpacity();
    }
  }

  protected getDefaultFill(): string | null {
    const colors = this.theme().colors;
    switch (this.variant()) {
      case 'default':
        return colors.accent;
      case 'secondary':
        return colors.surface1;
      case 'destructive':
        return colors.red;
      default:
        return null;
    }
  }

  protected getDefaultStroke(): string | null {
    return this.variant() === 'outline' ? this.theme().colors.border : null;
  }

  protected getDefaultTextColor(): string {
    const colors = this.theme().colors;
    switch (this.variant()) {
      case 'default':
      case 'destructive':
        return colors.background;
      case 'link':
        return colors.accent;
      default:
        return colors.foreground;
    }
  }

  protected getDefaultFontFamily(): string {
    return this.theme().typography.fontFamily;
  }

  protected getDefaultFontSize(): number {
    return this.theme().typography.label;
  }

  protected getDefaultFontWeight(): number {
    return 600;
  }
}
