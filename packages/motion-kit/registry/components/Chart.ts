import {
  Line,
  Node,
  Rect,
  canvasStyleSignal,
  drawRoundRect,
  initial,
  nodeName,
  resolveCanvasStyle,
  signal,
  type CanvasStyleSignal,
  type LineProps,
  type NodeProps,
  type PossibleCanvasStyle,
  type RectProps,
} from '@canvas-commons/2d';
import {
  BBox,
  Vector2,
  clamp,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** A finite, increasing plot range. */
export type ChartRange = readonly [number, number];
/** One tick with an optional display label. */
export interface ChartTick {
  value: number;
  label?: string;
}
/** Plot frame props. Native padding does not change the data coordinate mapping. */
export interface ChartProps extends RectProps {
  xRange?: SignalValue<ChartRange>;
  yRange?: SignalValue<ChartRange>;
  origin?: SignalValue<readonly [number, number]>;
  theme?: SignalValue<MotionTheme>;
}

/**
 * A plot frame with data coordinates and composable axes and lines.
 * @example
 * ```tsx
 * <Chart xRange={[0,10]} yRange={[0,1]}>
 *   <ChartAxis orientation="x" label="Time" />
 *   <ChartAxis orientation="y" label="Value" />
 *   <ChartLine data={[[0,0],[5,.6],[10,1]]} />
 * </Chart>
 * ```
 */
@nodeName('Chart')
export class Chart extends Rect {
  @initial([0, 1])
  @signal()
  declare public readonly xRange: SimpleSignal<ChartRange, this>;
  @initial([0, 1])
  @signal()
  declare public readonly yRange: SimpleSignal<ChartRange, this>;
  @initial([0, 0])
  @signal()
  declare public readonly origin: SimpleSignal<readonly [number, number], this>;
  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;
  public constructor(props: ChartProps = {}) {
    super({size: [900, 500], layoutChildren: false, ...props});
  }
  /**
   * Test whether both ranges have finite, increasing endpoints.
   * @example
   * ```ts
   * if (chart().valid()) yield* series().end(1, 1);
   * ```
   */
  public valid(): boolean {
    return [this.xRange(), this.yRange()].every(
      ([min, max]) => Number.isFinite(min) && Number.isFinite(max) && max > min,
    );
  }
  /**
   * Map a data coordinate to the frame's local scene coordinates.
   * @example
   * ```ts
   * marker().position(() => chart().point(5, 0.5));
   * ```
   */
  public point(x: number, y: number): Vector2 {
    if (!this.valid() || !Number.isFinite(x) || !Number.isFinite(y)) {
      return Vector2.zero;
    }
    const [xmin, xmax] = this.xRange(),
      [ymin, ymax] = this.yRange();
    return new Vector2(
      ((x - xmin) / (xmax - xmin) - 0.5) * this.width(),
      (0.5 - (y - ymin) / (ymax - ymin)) * this.height(),
    );
  }
  protected override drawChildren(context: CanvasRenderingContext2D): void {
    for (const child of this.sortedChildren()) {
      context.save();
      if (child instanceof ChartLine) {
        const inset = Math.max(0, child.lineWidth()) / 2;
        const path = new Path2D();
        drawRoundRect(
          path,
          BBox.fromSizeCentered(this.size()).expand(inset),
          this.radius().addScalar(inset),
          this.smoothCorners(),
          this.cornerSharpness(),
        );
        context.clip(path);
      }
      child.render(context);
      context.restore();
    }
  }
}
function findChart(node: Node): Chart | null {
  let parent = node.parent();
  while (parent) {
    if (parent instanceof Chart) return parent;
    parent = parent.parent();
  }
  return null;
}

export interface ChartAxisProps extends NodeProps {
  orientation?: SignalValue<'x' | 'y'>;
  label?: SignalValue<string>;
  ticks?: SignalValue<readonly ChartTick[] | null>;
  tickCount?: SignalValue<number>;
  tickLength?: SignalValue<number>;
  fontSize?: SignalValue<number>;
  lineWidth?: SignalValue<number>;
  color?: SignalValue<PossibleCanvasStyle>;
  progress?: SignalValue<number>;
}
/**
 * An axis with automatic or explicit ticks. Origin and style follow its Chart.
 * @example
 * ```tsx
 * <ChartAxis orientation="x" label="Seconds" ticks={[{value:0,label:'Start'},{value:10,label:'End'}]} />
 * ```
 */
@nodeName('ChartAxis')
export class ChartAxis extends Node {
  @initial('x')
  @signal()
  declare public readonly orientation: SimpleSignal<'x' | 'y', this>;
  @initial('')
  @signal()
  declare public readonly label: SimpleSignal<string, this>;
  @initial(null)
  @signal()
  declare public readonly ticks: SimpleSignal<
    readonly ChartTick[] | null,
    this
  >;
  @initial(5)
  @signal()
  declare public readonly tickCount: SimpleSignal<number, this>;
  @initial(12)
  @signal()
  declare public readonly tickLength: SimpleSignal<number, this>;
  @signal()
  declare public readonly fontSize: SimpleSignal<number, this>;
  @initial(4)
  @signal()
  declare public readonly lineWidth: SimpleSignal<number, this>;
  @canvasStyleSignal()
  declare public readonly color: CanvasStyleSignal<this>;
  @initial(1)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;
  public constructor(props: ChartAxisProps = {}) {
    super(props);
  }
  private theme(): MotionTheme {
    return findChart(this)?.theme() ?? defaultTheme;
  }
  protected getDefaultColor(): string {
    return this.theme().colors.muted;
  }
  protected getDefaultFontSize(): number {
    return this.theme().typography.caption;
  }
  /**
   * Read the visible-range ticks, generating an evenly spaced set when omitted.
   * @example
   * ```ts
   * const ticks = axis().tickValues();
   * ```
   */
  public tickValues(): readonly ChartTick[] {
    const chart = findChart(this);
    if (!chart?.valid()) return [];
    const [min, max] =
      this.orientation() === 'x' ? chart.xRange() : chart.yRange();
    const specified = this.ticks();
    if (specified !== null) {
      return specified.filter(
        tick =>
          Number.isFinite(tick.value) && tick.value >= min && tick.value <= max,
      );
    }
    const count = Number.isFinite(this.tickCount())
      ? Math.max(1, Math.min(20, Math.floor(this.tickCount())))
      : 5;
    return Array.from({length: count + 1}, (_, i) => ({
      value: min + ((max - min) * i) / count,
    }));
  }
  /**
   * Draw the axis and reveal ticks as the drawing reaches them.
   * @example
   * ```ts
   * yield* axis().reveal();
   * ```
   */
  public *reveal(
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    this.progress(0);
    yield* this.progress(1, duration, easing);
  }
  protected override getCacheBBox(): BBox {
    const chart = findChart(this);
    return chart
      ? BBox.fromSizeCentered(chart.size()).expand(
          this.fontSize() * 3 + this.tickLength() + this.theme().spacing.medium,
        )
      : super.getCacheBBox();
  }
  protected override draw(context: CanvasRenderingContext2D): void {
    const chart = findChart(this),
      progress = Number.isFinite(this.progress())
        ? Math.max(0, Math.min(1, this.progress()))
        : 0;
    if (!chart?.valid() || progress <= 0 || this.color() === null) return;
    const [xmin, xmax] = chart.xRange(),
      [ymin, ymax] = chart.yRange();
    const [ox, oy] = chart.origin();
    const origin = chart.point(
      Math.max(xmin, Math.min(xmax, ox)),
      Math.max(ymin, Math.min(ymax, oy)),
    );
    const horizontal = this.orientation() === 'x',
      size = chart.size();
    const start = horizontal
      ? new Vector2(-size.x / 2, origin.y)
      : new Vector2(origin.x, size.y / 2);
    const end = horizontal
      ? new Vector2(size.x / 2, origin.y)
      : new Vector2(origin.x, -size.y / 2);
    context.save();
    const ink = resolveCanvasStyle(this.color(), context);
    context.strokeStyle = ink;
    context.fillStyle = ink;
    context.lineWidth = this.lineWidth();
    context.lineCap = 'round';
    const lineProgress = Math.min(1, progress / 0.8);
    const tip = Vector2.lerp(start, end, lineProgress);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(tip.x, tip.y);
    context.stroke();
    const headOpacity = clamp(0, 1, (progress - 0.8) / 0.2);
    if (headOpacity > 0) {
      context.save();
      context.globalAlpha *= headOpacity;
      const head = this.lineWidth() * 2;
      context.beginPath();
      context.moveTo(end.x, end.y);
      context.lineTo(
        end.x + (horizontal ? -head : -head / 2),
        end.y + (horizontal ? -head / 2 : head),
      );
      context.moveTo(end.x, end.y);
      context.lineTo(
        end.x + (horizontal ? -head : head / 2),
        end.y + (horizontal ? head / 2 : head),
      );
      context.stroke();
      context.restore();
    }
    context.font = `${this.fontSize()}px ${this.theme().typography.fontFamily}`;
    context.textBaseline = 'middle';
    for (const tick of this.tickValues()) {
      const ratio = horizontal
        ? (tick.value - xmin) / (xmax - xmin)
        : (tick.value - ymin) / (ymax - ymin);
      const opacity = clamp(0, 1, (progress - ratio * 0.8) / 0.2);
      if (opacity <= 0) continue;
      const p = chart.point(
        horizontal ? tick.value : Math.max(xmin, Math.min(xmax, ox)),
        horizontal ? Math.max(ymin, Math.min(ymax, oy)) : tick.value,
      );
      context.save();
      context.globalAlpha *= opacity;
      context.beginPath();
      context.moveTo(
        p.x - (horizontal ? 0 : this.tickLength() / 2),
        p.y - (horizontal ? this.tickLength() / 2 : 0),
      );
      context.lineTo(
        p.x + (horizontal ? 0 : this.tickLength() / 2),
        p.y + (horizontal ? this.tickLength() / 2 : 0),
      );
      context.stroke();
      context.textAlign = horizontal ? 'center' : 'right';
      const label = tick.label ?? String(Number(tick.value.toFixed(3)));
      context.fillText(
        label,
        p.x -
          (horizontal ? 0 : this.tickLength() / 2 + this.theme().spacing.small),
        p.y +
          (horizontal
            ? this.tickLength() / 2 +
              this.fontSize() / 2 +
              this.theme().spacing.small
            : 0),
      );
      context.restore();
    }
    const labelOpacity = clamp(0, 1, (progress - 0.65) / 0.35);
    if (labelOpacity > 0 && this.label()) {
      context.globalAlpha *= labelOpacity;
      context.font = `${this.theme().typography.label}px ${this.theme().typography.fontFamily}`;
      context.textAlign = 'center';
      if (horizontal) {
        context.fillText(
          this.label(),
          0,
          origin.y + this.fontSize() * 2 + this.theme().spacing.medium,
        );
      } else {
        context.translate(
          origin.x - this.fontSize() * 3 - this.theme().spacing.medium,
          0,
        );
        context.rotate(-Math.PI / 2);
        context.fillText(this.label(), 0, 0);
      }
    }
    context.restore();
    this.drawChildren(context);
  }
}

export interface ChartLineProps extends LineProps {
  data?: SignalValue<readonly (readonly [number, number])[]>;
  progress?: SignalValue<number>;
}
/**
 * A data line with a horizontal reveal that keeps boundary strokes visible.
 * @example
 * ```tsx
 * <ChartLine ref={series} data={[[0,0],[5,.5],[10,1]]} progress={0} />
 * // yield* series().reveal(1);
 * ```
 */
@nodeName('ChartLine')
export class ChartLine extends Line {
  @initial([])
  @signal()
  declare public readonly data: SimpleSignal<
    readonly (readonly [number, number])[],
    this
  >;
  @initial(1)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;
  public constructor({children = [], ...props}: ChartLineProps = {}) {
    super({
      children,
      layoutSelf: false,
      lineWidth: 4,
      lineCap: 'round',
      ...props,
    });
  }
  protected getDefaultStroke(): string {
    return findChart(this)?.theme().colors.accent ?? defaultTheme.colors.accent;
  }
  protected getDefaultPoints(): Vector2[] {
    const chart = findChart(this);
    return chart?.valid()
      ? this.data()
          .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
          .map(([x, y]) => chart.point(x, y))
      : [];
  }
  protected getDefaultEnd(): number {
    const progress = Number.isFinite(this.progress())
      ? clamp(0, 1, this.progress())
      : 0;
    if (progress === 0 || progress === 1) return progress;
    const chart = findChart(this);
    if (!chart?.valid() || this.parsedPoints().length < 2) return 0;
    const x = (progress - 0.5) * chart.width();
    let left = 0,
      right = 1;
    // Sampling the native path keeps rounded corners and end caps intact.
    for (let i = 0; i < 24; i++) {
      const middle = (left + right) / 2;
      if (this.getPointAtPercentage(middle).position.x < x) left = middle;
      else right = middle;
    }
    return (left + right) / 2;
  }
  /**
   * Reveal a series with increasing x values across the chart's horizontal range.
   * The chart theme supplies entrance easing; pass `linear` for a steady time axis.
   * @example
   * ```ts
   * yield* series().reveal(2);
   * ```
   */
  public *reveal(
    duration = findChart(this)?.theme().motion.long ?? defaultTheme.motion.long,
    easing: TimingFunction = findChart(this)?.theme().motion.enter ??
      defaultTheme.motion.enter,
  ): ThreadGenerator {
    this.progress(0);
    yield* this.progress(1, duration, easing);
  }
  /**
   * Retract the horizontal reveal using the chart theme's exit easing.
   * @example
   * ```ts
   * yield* series().erase();
   * ```
   */
  public *erase(
    duration = findChart(this)?.theme().motion.medium ??
      defaultTheme.motion.medium,
    easing: TimingFunction = findChart(this)?.theme().motion.exit ??
      defaultTheme.motion.exit,
  ): ThreadGenerator {
    yield* this.progress(0, duration, easing);
  }
  protected override draw(context: CanvasRenderingContext2D): void {
    if (
      !findChart(this)?.valid() ||
      this.end() <= this.start() ||
      this.parsedPoints().length < 2
    ) {
      this.drawChildren(context);
      return;
    }
    super.draw(context);
  }
}
