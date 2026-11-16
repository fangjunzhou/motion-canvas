import {
  Layout,
  Line,
  Txt,
  initial,
  nodeName,
  signal,
  type LayoutProps,
  type LineProps,
} from '@canvas-commons/2d';
import {
  all,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';
import {Card} from './Card';

export interface FlowConnection {
  label: SignalValue<string>;
  detail?: SignalValue<string>;
}
export interface FlowProps extends LayoutProps {
  theme?: SignalValue<MotionTheme>;
  connections?: readonly FlowConnection[];
}

export interface FlowArrowProps extends LineProps {
  theme?: SignalValue<MotionTheme>;
}

/**
 * A clean diagram edge with native straight or orthogonal points.
 * @example
 * ```ts
 * const arrow = new FlowArrow({points: [[-100, 0], [100, 0]]});
 * view.add(arrow);
 * yield* arrow.end(1, 0.5);
 * ```
 */
@nodeName('FlowArrow')
export class FlowArrow extends Line {
  @initial(defaultTheme) @signal() declare public readonly theme: SimpleSignal<
    MotionTheme,
    this
  >;

  public constructor(props: FlowArrowProps = {}) {
    super({
      layout: false,
      lineWidth: 3,
      endArrow: true,
      arrowSize: 16,
      end: 0,
      ...props,
    });
  }

  protected getDefaultStroke(): string {
    return this.theme().colors.accent;
  }
}

/** A row of Kit cards with optional labeled arrow connectors. */
@nodeName('Flow')
export class Flow extends Layout {
  @initial(defaultTheme) @signal() declare public readonly theme: SimpleSignal<
    MotionTheme,
    this
  >;
  public readonly stages: readonly Card[];
  public readonly arrows: FlowArrow[] = [];
  public readonly connectors: Layout[] = [];
  public constructor({connections = [], ...props}: FlowProps = {}) {
    super({
      layout: true,
      direction: 'row',
      alignItems: 'stretch',
      gap: () => this.theme().spacing.small,
      ...props,
    });
    this.stages = this.children().filter(
      (child): child is Card => child instanceof Card,
    );
    for (let index = 1; index < this.stages.length; index++) {
      const connection = connections[index - 1];
      const slot = new Layout({
        layout: true,
        direction: 'column',
        alignItems: 'stretch',
        alignSelf: 'center',
        shrink: 0,
        width: () =>
          connection
            ? this.theme().typography.caption * 7
            : this.theme().spacing.medium,
        gap: () => this.theme().spacing.small,
      });
      const text = (value: SignalValue<string>) =>
        new Txt({
          text: value,
          textWrap: true,
          textAlign: 'center',
          fontFamily: () => this.theme().typography.fontFamily,
          fontSize: () => this.theme().typography.caption,
          fill: () => this.theme().colors.muted,
        });
      if (connection) slot.add(text(connection.label));
      const arrowRow = new Layout({
        layout: true,
        height: () => this.theme().spacing.small,
        alignSelf: 'stretch',
      });
      const line = new FlowArrow({
        theme: () => this.theme(),
        layout: false,
        points: () => [
          [-slot.width() / 2, 0],
          [slot.width() / 2, 0],
        ],
        end: 1,
      });
      arrowRow.add(line);
      slot.add(arrowRow);
      if (connection?.detail) slot.add(text(connection.detail));
      this.arrows.push(line);
      this.connectors.push(slot);
      this.insert(slot, this.children().indexOf(this.stages[index]));
    }
  }
  /**
   * Reveal each card after its incoming label and arrow. Keep the flow at
   * opacity zero until this method starts when a parent enters first.
   * @example
   * ```ts
   * const flow = new Flow({opacity: 0, children: cards});
   * view.add(flow);
   * yield* flow.enter();
   * ```
   */
  public *enter(
    duration = this.theme().motion.long * 2,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const step =
      duration / Math.max(1, this.stages.length + this.arrows.length);
    const states = [this, ...this.stages, ...this.connectors].map(node => ({
      node,
      raw: node.opacity.context.raw(),
    }));
    const ends = this.arrows.map(node => ({
      node,
      raw: node.end.context.raw(),
    }));
    let completed = false;
    for (const card of this.stages) card.opacity(0);
    for (const connector of this.connectors) connector.opacity(0);
    for (const arrow of this.arrows) arrow.end(0);
    this.opacity(1);
    try {
      for (let index = 0; index < this.stages.length; index++) {
        if (index > 0) {
          yield* all(
            this.connectors[index - 1].opacity(1, step, easing),
            this.arrows[index - 1].end(1, step, easing),
          );
        }
        yield* this.stages[index].enter(step, easing);
      }
      completed = true;
    } finally {
      if (!completed) {
        for (const {node, raw} of states) {
          if (raw === undefined) node.opacity.reset();
          else node.opacity(raw);
        }
        for (const {node, raw} of ends) {
          if (raw === undefined) node.end.reset();
          else node.end(raw);
        }
      }
    }
  }
  /**
   * Emphasize one stage using the local semantic accent.
   * @example
   * ```ts
   * yield* flow().emphasize(1);
   * ```
   */
  public *emphasize(
    index: number,
    duration = this.theme().motion.medium,
  ): ThreadGenerator {
    const card = this.stages[index];
    if (!card) throw new RangeError('Flow stage index is out of range.');
    const raw = card.stroke.context.raw();
    const rawScale = card.scale.context.raw();
    const resting = card.scale();
    try {
      yield* all(
        card.stroke(
          this.theme().colors.accent,
          duration,
          this.theme().motion.emphasize,
        ),
        card.scale(resting.scale(1.02), duration),
      );
      yield* card.scale(resting, duration);
    } finally {
      if (raw === undefined) card.stroke.reset();
      else card.stroke(raw);
      if (rawScale === undefined) card.scale.reset();
      else card.scale(rawScale);
    }
  }
}
