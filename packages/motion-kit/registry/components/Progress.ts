import {
  Rect,
  canvasStyleSignal,
  initial,
  nodeName,
  resolveCanvasStyle,
  signal,
  type CanvasStyleSignal,
  type PossibleCanvasStyle,
  type RectProps,
} from '@canvas-commons/2d';
import type {SignalValue, SimpleSignal} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Native track props with reactive progress bounds and indicator styling. */
export interface ProgressProps extends RectProps {
  value?: SignalValue<number>;
  min?: SignalValue<number>;
  max?: SignalValue<number>;
  theme?: SignalValue<MotionTheme>;
  indicatorFill?: SignalValue<PossibleCanvasStyle>;
}

/**
 * A progress track. Value uses the range from min to max, normally 0 to 100.
 * Animate the value signal from the calling scene; construction starts no threads.
 *
 * @example
 * ```tsx
 * <Progress value={() => progress() * 100} width={600} />
 * ```
 */
@nodeName('Progress')
export class Progress extends Rect {
  @initial(0)
  @signal()
  declare public readonly value: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  declare public readonly min: SimpleSignal<number, this>;

  @initial(100)
  @signal()
  declare public readonly max: SimpleSignal<number, this>;

  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  @canvasStyleSignal()
  declare public readonly indicatorFill: CanvasStyleSignal<this>;

  public constructor(props: ProgressProps = {}) {
    super({height: 16, ...props});
  }

  /**
   * Read the bounded completion fraction. Invalid bounds or values return zero.
   * @example
   * ```ts
   * const percent = Math.round(bar().fraction() * 100);
   * ```
   */
  public fraction(): number {
    const min = this.min();
    const max = this.max();
    const value = this.value();
    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      !Number.isFinite(value) ||
      max <= min
    ) {
      return 0;
    }
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  protected getDefaultFill(): string {
    return this.theme().colors.background;
  }

  protected getDefaultIndicatorFill(): string {
    return this.theme().colors.accent;
  }

  protected override draw(context: CanvasRenderingContext2D): void {
    this.drawShape(context);
    const fraction = this.fraction();
    if (fraction > 0) {
      context.save();
      context.clip(this.getPath());
      context.beginPath();
      const width = this.width() * fraction;
      const x =
        this.textDirection() === 'rtl'
          ? this.width() / 2 - width
          : -this.width() / 2;
      context.rect(x, -this.height() / 2, width, this.height());
      context.fillStyle = resolveCanvasStyle(this.indicatorFill(), context);
      if (this.indicatorFill() !== null) context.fill();
      context.restore();
    }
    this.drawChildren(context);
  }
}
