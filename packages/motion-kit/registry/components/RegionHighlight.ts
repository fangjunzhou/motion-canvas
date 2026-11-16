import {
  Layout,
  Node,
  canvasStyleSignal,
  initial,
  nodeName,
  resolveCanvasStyle,
  signal,
  vector2Signal,
  type CanvasStyleSignal,
  type NodeProps,
  type PossibleCanvasStyle,
} from '@canvas-commons/2d';
import {
  BBox,
  type PossibleVector2,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
  type Vector2Signal,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** A rectangle in the source document's coordinate system. */
export interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Highlight a document or image region without changing its layout. */
export interface RegionHighlightProps extends NodeProps {
  area: SignalValue<HighlightArea>;
  coordinateSize?: SignalValue<PossibleVector2>;
  color?: SignalValue<PossibleCanvasStyle>;
  progress?: SignalValue<number>;
  theme?: SignalValue<MotionTheme>;
}
/**
 * A marker rectangle attached to the coordinate system of its parent frame.
 * @example
 * ```tsx
 * <RegionHighlight area={{x:100,y:200,width:500,height:80}} coordinateSize={[1000,1000]} />
 * ```
 */
@nodeName('RegionHighlight')
export class RegionHighlight extends Node {
  @initial({x: 0, y: 0, width: 0, height: 0})
  @signal()
  declare public readonly area: SimpleSignal<HighlightArea, this>;
  @initial([1000, 1000])
  @vector2Signal('coordinateSize')
  declare public readonly coordinateSize: Vector2Signal<this>;
  @canvasStyleSignal()
  declare public readonly color: CanvasStyleSignal<this>;
  @initial(0)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;
  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;
  public constructor(props: RegionHighlightProps) {
    super({opacity: 0.35, ...props});
  }
  /**
   * Read the region mapped into its parent's frame, before the reveal is applied.
   * @example
   * ```ts
   * const bounds = marker().bounds();
   * ```
   */
  public bounds(): BBox {
    const coords = this.coordinateSize(),
      parent = this.parent();
    const size = parent instanceof Layout ? parent.size() : coords;
    const area = this.area();
    if (
      coords.x <= 0 ||
      coords.y <= 0 ||
      ![coords.x, coords.y, size.x, size.y, ...Object.values(area)].every(
        Number.isFinite,
      )
    ) {
      return new BBox();
    }
    const scale = size.div(coords);
    return new BBox(
      area.x * scale.x - size.x / 2,
      area.y * scale.y - size.y / 2,
      Math.max(0, area.width) * scale.x,
      Math.max(0, area.height) * scale.y,
    );
  }
  /**
   * Draw the highlight horizontally across its region.
   * @example
   * ```ts
   * yield* marker().reveal();
   * ```
   */
  public *reveal(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    this.progress(0);
    yield* this.progress(1, duration, easing);
  }
  /**
   * Retract the marker while keeping the underlying document visible.
   * @example
   * ```ts
   * yield* marker().erase();
   * ```
   */
  public *erase(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    yield* this.progress(0, duration, easing);
  }
  protected getDefaultColor(): string {
    return this.theme().colors.yellow;
  }
  protected override getCacheBBox(): BBox {
    return super.getCacheBBox().union(this.bounds());
  }
  protected override draw(context: CanvasRenderingContext2D): void {
    const box = this.bounds(),
      progress = Number.isFinite(this.progress())
        ? Math.max(0, Math.min(1, this.progress()))
        : 0;
    if (this.color() !== null && progress > 0) {
      context.save();
      context.fillStyle = resolveCanvasStyle(this.color(), context);
      context.fillRect(box.x, box.y, box.width * progress, box.height);
      context.restore();
    }
    this.drawChildren(context);
  }
}
