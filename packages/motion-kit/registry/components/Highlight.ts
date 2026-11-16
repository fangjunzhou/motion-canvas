import {
  Txt,
  canvasStyleParser,
  canvasStyleSignal,
  initial,
  interpolation,
  nodeName,
  parser,
  resolveCanvasStyle,
  signal,
  type CanvasStyleSignal,
  type PossibleCanvasStyle,
  type TxtProps,
} from '@canvas-commons/2d';
import {
  BBox,
  Spacing,
  type PossibleSpacing,
  type Signal,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Marker geometry, independent of text layout and animation timing. */
export type HighlightStyle = 'straight' | 'hand-drawn';

/** A phrase and its optional marker color within one wrapping paragraph. */
export interface HighlightSelection {
  text: string;
  color?: PossibleCanvasStyle;
}

/** Native text props with a draw-on marker behind the first matching phrase. */
export interface HighlightProps extends TxtProps {
  style?: SignalValue<HighlightStyle>;
  progress?: SignalValue<number>;
  selection?: SignalValue<string | null>;
  selections?: SignalValue<readonly HighlightSelection[]>;
  color?: SignalValue<PossibleCanvasStyle>;
  markerPadding?: SignalValue<PossibleSpacing>;
  iterations?: SignalValue<number>;
  seed?: SignalValue<number>;
  maxRandomnessOffset?: SignalValue<number>;
  rtl?: SignalValue<boolean>;
  disabled?: SignalValue<boolean>;
  theme?: SignalValue<MotionTheme>;
}

/**
 * Text with a seeded marker stroke. Progress changes paint, never text layout.
 * Use selection to highlight a phrase within a wrapping paragraph.
 *
 * @example
 * ```tsx
 * <Highlight text="A truly remarkable result." selection="remarkable" progress={0} />
 * // yield* marker().reveal();
 * ```
 */
@nodeName('Highlight')
export class Highlight extends Txt {
  @initial('straight')
  @signal()
  declare public readonly style: SimpleSignal<HighlightStyle, this>;

  @initial(0)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;

  @initial(null)
  @signal()
  declare public readonly selection: SimpleSignal<string | null, this>;

  /** Multiple phrase markers; a nonempty list takes precedence over selection. */
  @initial([])
  @signal()
  declare public readonly selections: SimpleSignal<
    readonly HighlightSelection[],
    this
  >;

  @canvasStyleSignal()
  declare public readonly color: CanvasStyleSignal<this>;

  @initial(0)
  @parser((value: PossibleSpacing) => new Spacing(value))
  @interpolation(Spacing.lerp)
  @signal()
  declare public readonly markerPadding: Signal<PossibleSpacing, Spacing, this>;

  @initial(2)
  @signal()
  declare public readonly iterations: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  declare public readonly seed: SimpleSignal<number, this>;

  @initial(5)
  @signal()
  declare public readonly maxRandomnessOffset: SimpleSignal<number, this>;

  @initial(false)
  @signal()
  declare public readonly rtl: SimpleSignal<boolean, this>;

  @initial(false)
  @signal()
  declare public readonly disabled: SimpleSignal<boolean, this>;

  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  public constructor(props: HighlightProps = {}) {
    super({roughness: 3, bowing: 1, ...props});
  }

  /**
   * Draw the marker from zero to one, leaving the text visible throughout.
   * @example
   * ```ts
   * yield* marker().reveal(0.8);
   * ```
   */
  public *reveal(
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    this.progress(0);
    yield* this.progress(1, duration, easing);
  }

  /**
   * Retract the marker while preserving the text and its layout.
   * @example
   * ```ts
   * yield* marker().erase(0.4);
   * ```
   */
  public *erase(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    yield* this.progress(0, duration, easing);
  }

  /**
   * Read the marker's padded, text-local boxes, one per selected line.
   * @example
   * ```ts
   * const lines = marker().markerBoxes();
   * ```
   */
  public markerBoxes(): BBox[] {
    return this.markers().map(marker => marker.box);
  }

  private markers() {
    const selections = this.selections();
    const ranges = selections.length
      ? selections
      : [{text: this.selection(), color: this.color()}];
    return ranges.flatMap(range =>
      this.selectionBoxes(range.text).map(box => ({
        box,
        color: canvasStyleParser(range.color ?? this.color()),
      })),
    );
  }

  private selectionBoxes(selection: string | null): BBox[] {
    const text = this.text();
    const start = selection === null ? 0 : text.indexOf(selection);
    if (start < 0 || selection === '') return [];
    const end = selection === null ? text.length : start + selection.length;
    const lines = new Map<number, BBox>();
    let cursor = 0;
    for (const unit of this.textGlyphs()) {
      const at = text.indexOf(unit.text, cursor);
      if (at < 0) continue;
      cursor = at + unit.text.length;
      if (at >= end || cursor <= start || unit.width <= 0) continue;
      const box = new BBox(
        unit.x - unit.width / 2,
        unit.y - unit.height * (this.style() === 'straight' ? 0.5 : 0.35),
        unit.width,
        unit.height * (this.style() === 'straight' ? 1 : 0.8),
      );
      const previous = lines.get(unit.lineIndex);
      lines.set(unit.lineIndex, previous ? previous.union(box) : box);
    }
    return [...lines.values()].map(box => box.expand(this.markerPadding()));
  }

  private noise(index: number): number {
    const seed = Number.isFinite(this.seed()) ? this.seed() : 1;
    const value = Math.sin(seed * 127.1 + index * 311.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  private deviation(): number {
    const offset = this.maxRandomnessOffset();
    const roughness = this.roughness();
    return Number.isFinite(offset) && Number.isFinite(roughness)
      ? (Math.max(0, offset) * Math.max(0, roughness)) / 3
      : 0;
  }

  protected getDefaultColor(): string {
    return this.theme().colors.yellow;
  }

  protected getDefaultFill(): string {
    return this.theme().colors.foreground;
  }

  protected getDefaultFontFamily(): string {
    return this.theme().typography.fontFamily;
  }

  protected getDefaultFontSize(): number {
    return this.theme().typography.body;
  }

  protected override getCacheBBox(): BBox {
    return this.markerBoxes().reduce(
      (bounds, box) =>
        bounds.union(
          this.style() === 'straight'
            ? box
            : box.expand(this.deviation() + box.height / 4),
        ),
      super.getCacheBBox(),
    );
  }

  protected override draw(context: CanvasRenderingContext2D): void {
    const progress = this.progress();
    const iterations = this.iterations();
    const handDrawn = this.style() === 'hand-drawn';
    if (
      !this.disabled() &&
      Number.isFinite(progress) &&
      (!handDrawn || Number.isFinite(iterations))
    ) {
      const markers = this.markers().filter(
        ({box, color}) => color !== null && box.width > 0 && box.height > 0,
      );
      const passes = handDrawn
        ? Math.max(0, Math.min(16, Math.floor(iterations)))
        : 1;
      const total = markers.reduce((sum, {box}) => sum + box.width * passes, 0);
      let remaining = total * Math.max(0, Math.min(1, progress));
      context.save();
      for (const [line, {box, color}] of markers.entries()) {
        if (color === null) continue;
        context.fillStyle = resolveCanvasStyle(color, context);
        for (let pass = 0; pass < passes; pass++) {
          const length = Math.min(box.width, Math.max(0, remaining));
          remaining -= box.width;
          if (length === 0) continue;
          const reverse = this.rtl() !== (pass % 2 === 1);
          if (!handDrawn) {
            context.fillRect(
              reverse ? box.right - length : box.x,
              box.y,
              length,
              box.height,
            );
            continue;
          }
          const jitter = (i: number) =>
            this.noise(line * 101 + pass * 13 + i) *
            Math.min(this.deviation(), box.height / 4);
          const bend = Number.isFinite(this.bowing())
            ? (Math.max(-3, Math.min(3, this.bowing())) * box.height) / 12
            : 0;
          context.save();
          context.beginPath();
          context.rect(
            reverse ? box.right - length : box.x,
            box.y - box.height,
            length,
            box.height * 3,
          );
          context.clip();
          context.beginPath();
          context.moveTo(box.x, box.y + jitter(0));
          context.bezierCurveTo(
            box.x + box.width / 3,
            box.y + jitter(1) - bend,
            box.x + (box.width * 2) / 3,
            box.y + jitter(2) - bend,
            box.right,
            box.y + jitter(3),
          );
          context.lineTo(box.right, box.bottom + jitter(4));
          context.bezierCurveTo(
            box.x + (box.width * 2) / 3,
            box.bottom + jitter(5) + bend,
            box.x + box.width / 3,
            box.bottom + jitter(6) + bend,
            box.x,
            box.bottom + jitter(7),
          );
          context.closePath();
          context.fill();
          context.restore();
        }
      }
      context.restore();
    }
    super.draw(context);
  }
}
