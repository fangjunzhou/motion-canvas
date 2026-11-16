import {
  Circle,
  Layout,
  Txt,
  initial,
  nodeName,
  signal,
  type CircleProps,
  type LayoutProps,
  type Node,
  type NodeProps,
  type NodeState,
  type TxtProps,
} from '@canvas-commons/2d';
import {
  CompoundSignalContext,
  sequence,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';
import {pushIn} from '../motion/effects';

function listTheme(node: Node): MotionTheme {
  let parent = node.parent();
  while (parent) {
    if (parent instanceof List) return parent.theme();
    parent = parent.parent();
  }
  return defaultTheme;
}

const Defaults = new WeakMap<Node, Map<string, unknown>>();

function rememberDefaults(node: Node, props: NodeProps, keys: string[]): void {
  const bindings = new Map<string, unknown>();
  for (const {key, meta, signal} of node) {
    if (!keys.includes(key) || key in props) continue;
    if (signal.context instanceof CompoundSignalContext) {
      for (const [entry, property] of signal.context.signals) {
        const name = meta.compoundEntries?.find(([key]) => key === entry)?.[1];
        if (name && !(name in props)) {
          bindings.set(name, property.context.raw());
        }
      }
    } else bindings.set(key, signal.context.raw());
  }
  Defaults.set(node, bindings);
}

function instanceProps(node: Node, props: NodeProps): NodeProps {
  const bindings = Defaults.get(node);
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) => !bindings?.has(key) || bindings.get(key) !== value,
    ),
  );
}

class ListLabel extends Txt {
  public constructor(props: TxtProps = {}) {
    super({
      textWrap: true,
      grow: 1,
      basis: 0,
      minWidth: 0,
      fontFamily: () => listTheme(this).typography.fontFamily,
      fontSize: () => listTheme(this).typography.body,
      fill: () => listTheme(this).colors.foreground,
      ...props,
    });
    rememberDefaults(this, props, ['fontFamily', 'fontSize', 'fill']);
  }
  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }
}

class ListMarker extends Circle {
  public constructor(props: CircleProps = {}) {
    super({
      size: () => listTheme(this).typography.caption / 3,
      shrink: 0,
      fill: () => listTheme(this).colors.foreground,
      marginTop: () => {
        const parent = this.parent();
        const label = parent?.findFirst(
          (node): node is Txt => node instanceof Txt,
        );
        return (
          ((label?.resolvedLineHeight() ??
            listTheme(this).typography.body * 1.2) -
            listTheme(this).typography.caption / 3) /
          2
        );
      },
      ...props,
    });
    rememberDefaults(this, props, ['size', 'fill', 'margin']);
  }
  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }
}

export interface ListProps extends LayoutProps {
  theme?: SignalValue<MotionTheme>;
}
/** A themed list with shape markers and scene-scheduled item entrances. */
@nodeName('List')
export class List extends Layout {
  @initial(defaultTheme) @signal() declare public readonly theme: SimpleSignal<
    MotionTheme,
    this
  >;
  public constructor(props: ListProps = {}) {
    super({
      layout: true,
      direction: 'column',
      gap: () => this.theme().spacing.medium,
      ...props,
    });
    rememberDefaults(this, props, ['gap']);
  }
  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }
  /**
   * Stagger a push entrance without moving the siblings' resting layout slots.
   * @example
   * ```ts
   * yield* list().enter();
   * ```
   */
  public *enter(
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const items = this.children();
    const interval = duration / Math.max(1, items.length + 1);
    yield* sequence(
      interval,
      ...items.map(item =>
        pushIn(item, {
          duration: interval * 2,
          easing,
          offset: [0, this.theme().spacing.small],
        }),
      ),
    );
  }
}

export interface ListItemProps extends LayoutProps {
  text?: SignalValue<string>;
}
/** A bullet item; use text for a plain label or children for rich native text. */
@nodeName('ListItem')
export class ListItem extends Layout {
  private itemLabel: Txt | null;
  private marker: Circle;
  public get label(): Txt | null {
    return this.itemLabel;
  }
  public constructor({text, children, ...props}: ListItemProps = {}) {
    super({
      layout: true,
      direction: 'row',
      alignItems: 'start',
      gap: () => listTheme(this).spacing.small,
      ...props,
    });
    rememberDefaults(this, props, ['gap']);
    this.marker = new ListMarker();
    this.itemLabel = text === undefined ? null : new ListLabel({text});
    this.add(this.marker);
    if (this.label) this.add(this.label);
    else if (children) this.add(children);
  }

  /**
   * Copy the current marker and content once, preserving reactive text and styles.
   * @example
   * ```ts
   * const copy = item.clone({opacity: 0});
   * ```
   */
  public override clone(props: NodeState = {}): this {
    return this.copyParts(super.clone({children: [], ...props}), props, false);
  }

  /**
   * Freeze the marker, label, and custom children for a scene transition.
   * @example
   * ```ts
   * const outgoing = item.snapshotClone();
   * ```
   */
  public override snapshotClone(props: NodeState = {}): this {
    return this.copyParts(
      super.snapshotClone({children: [], ...props}),
      props,
      true,
    );
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }

  private copyParts(copy: this, props: NodeState, snapshot: boolean): this {
    if ('children' in props || 'text' in props) return copy;
    const source = this.children().filter(child => child !== this.marker);
    const children = source.map(child =>
      snapshot ? child.snapshotClone() : child.clone(),
    );
    const marker = snapshot ? this.marker.snapshotClone() : this.marker.clone();
    const generated = copy.children();
    copy.children([marker, ...children]);
    copy.marker = marker;
    const label = children[source.indexOf(this.itemLabel ?? this.marker)];
    copy.itemLabel = label instanceof Txt ? label : null;
    for (const child of generated) child.dispose();
    return copy;
  }
}
