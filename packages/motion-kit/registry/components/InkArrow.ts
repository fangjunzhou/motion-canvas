import {
  Node,
  canvasStyleSignal,
  computed,
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
  Vector2,
  linear,
  tween,
  type PossibleVector2,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
  type Vector2Signal,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Native node props with local endpoints and a tapered ink brush. */
export interface InkArrowProps extends NodeProps {
  from: SignalValue<PossibleVector2>;
  to: SignalValue<PossibleVector2>;
  curvature?: SignalValue<number>;
  color?: SignalValue<PossibleCanvasStyle>;
  strokeWidth?: SignalValue<number>;
  pressure?: SignalValue<number>;
  release?: SignalValue<number>;
  grain?: SignalValue<number>;
  headSize?: SignalValue<number>;
  seed?: SignalValue<string>;
  step?: SignalValue<number>;
  progress?: SignalValue<number>;
  headProgress?: SignalValue<number>;
  theme?: SignalValue<MotionTheme>;
}

function bounded(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/**
 * A hand-drawn arrow with stop-motion shaft and head reveals. Endpoints are local;
 * native position, rotation, and scale place the arrow in the surrounding scene.
 * @example
 * ```tsx
 * <InkArrow ref={arrow} from={[-300, 100]} to={[300, -100]} />
 * // yield* arrow().reveal();
 * ```
 */
@nodeName('InkArrow')
export class InkArrow extends Node {
  @vector2Signal('from')
  declare public readonly from: Vector2Signal<this>;
  @vector2Signal('to')
  declare public readonly to: Vector2Signal<this>;
  @initial(0.35)
  @signal()
  declare public readonly curvature: SimpleSignal<number, this>;
  @canvasStyleSignal()
  declare public readonly color: CanvasStyleSignal<this>;
  @initial(8)
  @signal()
  declare public readonly strokeWidth: SimpleSignal<number, this>;
  @initial(0.2)
  @signal()
  declare public readonly pressure: SimpleSignal<number, this>;
  @initial(1)
  @signal()
  declare public readonly release: SimpleSignal<number, this>;
  @initial(1)
  @signal()
  declare public readonly grain: SimpleSignal<number, this>;
  @initial(24)
  @signal()
  declare public readonly headSize: SimpleSignal<number, this>;
  @initial('arrow')
  @signal()
  declare public readonly seed: SimpleSignal<string, this>;
  /** Seconds per stop-motion pose. Set zero for a smooth draw. */
  @initial(0.1)
  @signal()
  declare public readonly step: SimpleSignal<number, this>;
  @initial(0)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;
  /** First half draws one head arm; the second half draws the other. */
  @initial(0)
  @signal()
  declare public readonly headProgress: SimpleSignal<number, this>;
  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  public constructor(props: InkArrowProps) {
    super(props);
  }

  /**
   * Draw the shaft, then the head arms in order. Duration includes both stages.
   * @example
   * ```ts
   * yield* arrow().reveal(1.6);
   * ```
   */
  public *reveal(
    duration = this.theme().motion.long * 2,
    easing: TimingFunction = linear,
  ): ThreadGenerator {
    this.progress(0);
    this.headProgress(0);
    yield* this.animate(this.progress, 1, duration * 0.75, easing);
    yield* this.animate(this.headProgress, 1, duration * 0.25, easing);
  }

  /**
   * Retract the head arms, then the shaft, leaving the current pose if cancelled.
   * @example
   * ```ts
   * yield* arrow().erase(0.8);
   * ```
   */
  public *erase(
    duration = this.theme().motion.long,
    easing: TimingFunction = linear,
  ): ThreadGenerator {
    yield* this.animate(this.headProgress, 0, duration * 0.25, easing);
    yield* this.animate(this.progress, 0, duration * 0.75, easing);
  }

  private *animate(
    property: SimpleSignal<number, this>,
    target: number,
    duration: number,
    easing: TimingFunction,
  ): ThreadGenerator {
    const start = property();
    if (duration <= 0) {
      property(target);
      return;
    }
    yield* tween(duration, value => {
      const step = this.step();
      const pose =
        value === 1 || !Number.isFinite(step) || step <= 0
          ? value
          : (Math.floor((value * duration + 1e-9) / step) * step) / duration;
      property(start + (target - start) * easing(pose));
    });
  }

  private noise(key: string): number {
    let hash = 2166136261;
    for (const character of `${this.seed()}:${key}`) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    hash ^= hash >>> 16;
    return ((hash >>> 0) / 4294967295) * 2 - 1;
  }

  @computed()
  private controls(): [Vector2, Vector2] {
    const from = this.from(),
      delta = this.to().sub(from);
    const distance = delta.magnitude;
    const normal =
      distance > 0
        ? new Vector2(-delta.y, delta.x).scale(1 / distance)
        : Vector2.zero;
    const bow = Number.isFinite(this.curvature()) ? this.curvature() : 0;
    const control = (t: number, index: number) =>
      from
        .add(delta.scale(t))
        .add(normal.scale(bow * distance))
        .add(
          new Vector2(this.noise(`${index}:x`), this.noise(`${index}:y`)).scale(
            distance * 0.06,
          ),
        );
    return [control(1 / 3, 0), control(2 / 3, 1)];
  }

  /**
   * Read a point on the complete shaft, in local coordinates, at a clamped 0–1 parameter.
   * @example
   * ```ts
   * const midpoint = arrow().pointAt(0.5);
   * ```
   */
  public pointAt(progress: number): Vector2 {
    const t = bounded(progress),
      u = 1 - t;
    const [a, b] = this.controls();
    return this.from()
      .scale(u ** 3)
      .add(a.scale(3 * u * u * t))
      .add(b.scale(3 * u * t * t))
      .add(this.to().scale(t ** 3));
  }

  @computed()
  private head(): [Vector2, Vector2] {
    const [, control] = this.controls();
    const delta = this.to().sub(control);
    const back =
      delta.magnitude > 0
        ? delta.normalized.scale(-1)
        : this.from().sub(this.to()).normalized;
    const reach = Math.max(
      0,
      this.headSize(),
      this.weight(this.release()) * 2.6,
    );
    const arm = (angle: number) =>
      this.to().add(
        new Vector2(
          back.x * Math.cos(angle) - back.y * Math.sin(angle),
          back.x * Math.sin(angle) + back.y * Math.cos(angle),
        ).scale(reach),
      );
    return [arm(0.72), arm(-0.72)];
  }

  private weight(amount: number): number {
    return Number.isFinite(amount) && Number.isFinite(this.strokeWidth())
      ? Math.max(0, this.strokeWidth()) * Math.max(0, amount)
      : 0;
  }

  @computed()
  private shaft(): Vector2[] {
    return Array.from({length: 65}, (_, index) => this.pointAt(index / 64));
  }

  protected getDefaultColor(): string {
    return this.theme().colors.foreground;
  }

  protected override getCacheBBox(): BBox {
    const points = [...this.shaft(), ...this.head()];
    if (
      points.some(
        point => !Number.isFinite(point.x) || !Number.isFinite(point.y),
      )
    ) {
      return super.getCacheBBox();
    }
    const width = Math.max(
      this.weight(this.pressure()),
      this.weight(this.release()),
    );
    return super
      .getCacheBBox()
      .union(BBox.fromPoints(...points).expand(width * 2));
  }

  private ribbon(
    context: CanvasRenderingContext2D,
    points: Vector2[],
    progress: number,
    opening: number,
    closing: number,
    key: string,
  ) {
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
      lengths.push(lengths[i - 1] + points[i].sub(points[i - 1]).magnitude);
    }
    const total = lengths[lengths.length - 1];
    if (total <= 1e-6 || progress <= 0) return;
    const distance = total * bounded(progress);
    const left: Vector2[] = [],
      right: Vector2[] = [];
    for (let i = 0; i < points.length; i++) {
      const previous = Math.max(0, i - 1);
      const cutoff = lengths[i] >= distance && i > 0;
      const center = cutoff
        ? Vector2.lerp(
            points[previous],
            points[i],
            (distance - lengths[previous]) /
              Math.max(1e-6, lengths[i] - lengths[previous]),
          )
        : points[i];
      const direction = points[Math.min(i + 1, points.length - 1)].sub(
        points[previous],
      );
      const normal =
        direction.magnitude > 0
          ? new Vector2(-direction.y, direction.x).scale(
              1 / direction.magnitude,
            )
          : Vector2.zero;
      const t = Math.min(lengths[i], distance) / total;
      const grain = Number.isFinite(this.grain())
        ? Math.max(0, Math.min(3, this.grain()))
        : 0;
      const half = this.weight(opening + (closing - opening) * t) / 2;
      const edge = half * grain * 0.15;
      left.push(
        center.add(
          normal.scale(Math.max(0, half + edge * this.noise(`${key}:${i}:l`))),
        ),
      );
      right.push(
        center.sub(
          normal.scale(Math.max(0, half + edge * this.noise(`${key}:${i}:r`))),
        ),
      );
      if (cutoff) break;
    }
    if (left.length < 2) return;
    context.beginPath();
    context.moveTo(left[0].x, left[0].y);
    for (const point of [...left.slice(1), ...right.reverse()]) {
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    context.fill();
  }

  protected override draw(context: CanvasRenderingContext2D): void {
    const progress = bounded(this.progress());
    if (this.from().sub(this.to()).magnitude > 1e-6 && this.color() !== null) {
      context.save();
      context.fillStyle = resolveCanvasStyle(this.color(), context);
      context.globalAlpha *= 0.85;
      this.ribbon(
        context,
        this.shaft(),
        progress,
        this.pressure(),
        this.release(),
        'shaft',
      );
      if (progress === 1) {
        const arms = this.head();
        for (const [index, arm] of arms.entries()) {
          const points = Array.from({length: 17}, (_, i) =>
            Vector2.lerp(this.to(), arm, i / 16),
          );
          this.ribbon(
            context,
            points,
            bounded(this.headProgress() * 2 - index),
            this.release(),
            this.release() * 0.6,
            `head:${index}`,
          );
        }
      }
      context.restore();
    }
    this.drawChildren(context);
  }
}
