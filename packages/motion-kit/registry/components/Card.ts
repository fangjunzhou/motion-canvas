import {
  Img,
  Layout,
  Node,
  Rect,
  Txt,
  drawRoundRect,
  initial,
  nodeName,
  signal,
  type ImgProps,
  type LayoutProps,
  type NodeProps,
  type RectProps,
  type TxtProps,
} from '@canvas-commons/2d';
import {
  CompoundSignalContext,
  Spacing,
  Vector2,
  all,
  tween,
  type Signal,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Card density. Native `size` continues to control the node's dimensions. */
export type CardVariant = 'default' | 'sm';

/** Native rectangle props with reactive theme, density, and shared inset. */
export interface CardProps extends RectProps {
  theme?: SignalValue<MotionTheme>;
  variant?: SignalValue<CardVariant>;
  spacing?: SignalValue<number>;
}

/** Text replacements for the first matching card parts, plus an optional width. */
export interface CardTextUpdate {
  title?: string;
  description?: string;
  content?: string;
  footer?: string;
  width?: number;
}

/** Native footer props. Hidden footers occupy no layout space. */
export interface CardFooterProps extends RectProps {
  visible?: SignalValue<boolean>;
}

/** How a card image fits its frame while preserving its aspect ratio. */
export type CardImageFit = 'cover' | 'contain';

/** Native image props with optional visibility and aspect-preserving fitting. */
export interface CardImageProps extends ImgProps {
  visible?: SignalValue<boolean>;
  fit?: SignalValue<CardImageFit>;
}

/** A replacement image with optional frame dimensions and description. */
export interface CardImageUpdate {
  src: SignalValue<string>;
  height?: number;
  width?: number;
  description?: string;
}

function preserveSignal<TSetter, TValue extends TSetter, TOwner>(
  property: Signal<TSetter, TValue, TOwner>,
): () => void {
  const value = property.context.raw();
  return () => {
    if (value === undefined) property.reset();
    else property(value);
  };
}

function cloneResolved(node: Node): Node {
  return node.clone({children: node.children().map(cloneResolved)});
}

const DefaultBindings = new WeakMap<Node, Map<string, unknown>>();

function rememberDefaults(node: Node, props: NodeProps, keys: string[]): void {
  const supplied = new Set(Object.keys(props));
  const bindings = new Map<string, unknown>();
  for (const {key, meta, signal} of node) {
    if (!keys.includes(key) || supplied.has(key)) continue;
    if (signal.context instanceof CompoundSignalContext) {
      for (const [entry, property] of signal.context.signals) {
        const name = meta.compoundEntries?.find(([key]) => key === entry)?.[1];
        if (name && !supplied.has(name)) {
          bindings.set(name, property.context.raw());
        }
      }
    } else {
      bindings.set(key, signal.context.raw());
    }
  }
  DefaultBindings.set(node, bindings);
}

function instanceProps(node: Node, props: NodeProps): NodeProps {
  const defaults = DefaultBindings.get(node);
  // Constructor bindings must be recreated against the clone's own signals.
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) => !defaults?.has(key) || defaults.get(key) !== value,
    ),
  );
}

function findCard(node: Node): Card | null {
  let parent = node.parent();
  while (parent) {
    if (parent instanceof Card) return parent;
    parent = parent.parent();
  }
  return null;
}

function themeOf(node: Node): MotionTheme {
  return findCard(node)?.theme() ?? defaultTheme;
}

function spacingOf(node: Node): number {
  return findCard(node)?.spacing() ?? defaultTheme.padding.medium;
}

function hasContent(node: Node): boolean {
  return !(node instanceof Txt) || node.text().trim().length > 0;
}

/**
 * A themed, vertical container. Children are the public composition area.
 *
 * @example
 * ```tsx
 * <Card width={560} variant="sm">
 *   <CardHeader>
 *     <CardTitle text="Anticipation" />
 *     <CardDescription text="Prepare the viewer for the next action." />
 *   </CardHeader>
 *   <CardContent><Txt text="A ball dips down before it jumps." /></CardContent>
 *   <CardFooter><Txt text="Animation principle · 02 / 12" /></CardFooter>
 * </Card>
 * ```
 */
@nodeName('Card')
export class Card extends Rect {
  /** Theme inherited reactively by the card parts. */
  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  /** Use `sm` for the theme's small padding and gap tokens. */
  @initial('default')
  @signal()
  declare public readonly variant: SimpleSignal<CardVariant, this>;

  /** Card inset. An explicit value also overrides the default section gap. */
  @signal()
  declare public readonly spacing: SimpleSignal<number, this>;

  public constructor(props: CardProps = {}) {
    super({
      layout: true,
      direction: 'column',
      clip: true,
      lineWidth: 2,
      gap: () =>
        this.spacing.isInitial()
          ? this.theme().spacing[this.variant() === 'sm' ? 'small' : 'medium']
          : this.spacing(),
      padding: () => {
        const parts = this.children().filter(
          child => !(child instanceof Layout) || child.layoutEnabled(),
        );
        const first = parts[0];
        const last = parts.at(-1);
        return [
          first instanceof Img &&
          (!(first instanceof CardImage) || first.visible())
            ? 0
            : this.spacing(),
          0,
          last instanceof CardFooter && last.visible() ? 0 : this.spacing(),
          0,
        ];
      },
      radius: () => this.theme().radius.medium,
      ...props,
    });
    rememberDefaults(this, props, ['gap', 'padding', 'radius']);
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }

  /**
   * Fade in the surface, then the title, description, and content in order.
   * Duration covers the whole sequence. A visible footer follows the content.
   *
   * @example
   * ```ts
   * yield* card().enter(1.2);
   * ```
   */
  public *enter(
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    for (const child of this.children()) {
      if (child instanceof CardImage && child.visible()) yield child;
    }
    const parts = this.revealParts();
    const step = duration / (parts.length + 1);
    this.opacity(0);
    for (const part of parts) part.node.opacity(0);
    try {
      yield* this.opacity(1, step, easing);
      for (const part of parts) {
        yield* part.node.opacity(part.opacity, step, easing);
      }
    } finally {
      for (const part of parts) part.restore();
    }
  }

  /**
   * Expand the card to fit its hidden footer, then fade the footer in.
   * Calling this with no footer or an already visible footer does nothing.
   *
   * @example
   * ```ts
   * yield* card().showFooter(0.6);
   * ```
   */
  public *showFooter(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const footer = this.children().find(child => child instanceof CardFooter);
    if (!footer || footer.visible()) return;
    const restore = preserveSignal(footer.opacity);
    let opacity = 1;
    footer.opacity(0);
    try {
      yield* this.resizeParts(
        duration * 0.6,
        () => {
          footer.visible(true);
          restore();
          opacity = footer.opacity();
          footer.opacity(0);
        },
        easing,
      );
      yield* footer.opacity(opacity, duration * 0.4, easing);
    } finally {
      restore();
    }
  }

  /**
   * Fade the footer out, then close its layout space and resize the card.
   * Calling this with no footer or an already hidden footer does nothing.
   *
   * @example
   * ```ts
   * yield* card().hideFooter(0.6);
   * ```
   */
  public *hideFooter(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    const footer = this.children().find(child => child instanceof CardFooter);
    if (!footer || !footer.visible()) return;
    const restore = preserveSignal(footer.opacity);
    try {
      yield* footer.opacity(0, duration * 0.4, easing);
      yield* this.resizeParts(
        duration * 0.6,
        () => footer.visible(false),
        easing,
      );
    } finally {
      restore();
    }
  }

  /**
   * Expand the card to fit its hidden image, then fade the image in.
   * Image loading finishes before the animation starts. Missing or visible
   * images are left unchanged.
   *
   * @example
   * ```ts
   * yield* card().showImage(0.8);
   * ```
   */
  public *showImage(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const image = this.children().find(child => child instanceof CardImage);
    if (!image || image.visible()) return;
    yield image;
    const restore = preserveSignal(image.opacity);
    let opacity = 1;
    image.opacity(0);
    try {
      yield* this.resizeParts(
        duration * 0.6,
        () => {
          image.visible(true);
          restore();
          opacity = image.opacity();
          image.opacity(0);
        },
        easing,
      );
      yield* image.opacity(opacity, duration * 0.4, easing);
    } finally {
      restore();
    }
  }

  /**
   * Fade the image out, then close its layout space and resize the card.
   * Missing or already hidden images are left unchanged.
   *
   * @example
   * ```ts
   * yield* card().hideImage(0.8);
   * ```
   */
  public *hideImage(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    const image = this.children().find(child => child instanceof CardImage);
    if (!image || !image.visible()) return;
    const restore = preserveSignal(image.opacity);
    try {
      yield* image.opacity(0, duration * 0.4, easing);
      yield* this.resizeParts(
        duration * 0.6,
        () => image.visible(false),
        easing,
      );
    } finally {
      restore();
    }
  }

  /**
   * Load the next image, fade out the current image, resize, and fade back in.
   * An optional description changes with the image while both are faded out.
   * A hidden image changes source without becoming visible. On cancellation
   * before the resize finishes, the original source is restored.
   *
   * @example
   * ```ts
   * yield* card().changeImage({src: bunnyImage, width: 560, height: 560}, 1);
   * ```
   */
  public *changeImage(
    update: SignalValue<string> | CardImageUpdate,
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.emphasize,
  ): ThreadGenerator {
    const image = this.children().find(child => child instanceof CardImage);
    if (!image) return;
    const value: CardImageUpdate =
      typeof update === 'object' ? update : {src: update};
    const {src, width, height, description} = value;
    const changes = this.textChanges({description});
    const previousText = changes.map(change => ({
      node: change.node,
      snapshot: change.node.clone(),
    }));
    const preload = new Img({src});
    const restoreSource = preserveSignal(image.src);
    const restoreOpacity = preserveSignal(image.opacity);
    const restoreWidth = preserveSignal(this.width);
    const restoreHeight = preserveSignal(image.height);
    const textParts =
      width === undefined && description === undefined
        ? []
        : this.revealParts().filter(part => part.node !== image);
    const opacity = image.opacity();
    let committed = false;
    try {
      yield preload;
      if (!image.visible()) {
        image.src(src);
        if (height !== undefined) image.height(height);
        if (width !== undefined) this.width(width);
        for (const change of changes) change.node.text(change.text);
        committed = true;
        return;
      }
      yield* all(
        image.opacity(0, duration * 0.35, easing),
        ...textParts.map(part => part.node.opacity(0, duration * 0.35, easing)),
      );
      yield* this.resizeParts(
        duration * 0.3,
        () => {
          image.src(src);
          if (height !== undefined) image.height(height);
          if (width !== undefined) this.width(width);
          for (const change of changes) change.node.text(change.text);
        },
        easing,
      );
      committed = true;
      yield* all(
        image.opacity(opacity, duration * 0.35, easing),
        ...textParts.map(part =>
          part.node.opacity(part.opacity, duration * 0.35, easing),
        ),
      );
    } finally {
      preload.dispose();
      if (!committed) {
        restoreSource();
        restoreWidth();
        restoreHeight();
      }
      // Txt stores text bindings in its child leaves, rather than text.context.
      for (const {node, snapshot} of previousText) {
        if (!committed) node.children(snapshot.children());
        snapshot.dispose();
      }
      restoreOpacity();
      for (const part of textParts) part.restore();
    }
  }

  /**
   * Fade out the current text, resize, then replace and reveal the text in order.
   * `content` and `footer` address the first direct Txt in their respective parts.
   * Height and unchanged width bindings are restored after animation or cancellation.
   * An explicit width becomes the new width once the text is replaced.
   *
   * @example
   * ```ts
   * yield* card().changeText({title: 'Timing', content: 'Spacing gives motion its pace.', width: 800}, 1.2);
   * ```
   */
  public *changeText(
    update: CardTextUpdate,
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.emphasize,
  ): ThreadGenerator {
    const changes = this.textChanges(update);
    const restoreWidth = preserveSignal(this.width);
    const restoreHeight = preserveSignal(this.height);
    const before = this.size();
    const probe = this.clone({
      width: update.width ?? before.x,
      children: this.children().map(cloneResolved),
    });
    let after: Vector2;
    try {
      for (const change of probe.textChanges(update)) {
        change.node.text(change.text);
      }
      after = probe.size();
    } finally {
      probe.dispose();
    }
    const parts = this.revealParts();
    let committed = false;
    try {
      yield* all(
        ...parts.map(part => part.node.opacity(0, duration * 0.2, easing)),
      );
      this.size(before);
      yield* this.size(after, duration * 0.5, easing);
      for (const change of changes) change.node.text(change.text);
      committed = true;
      restoreHeight();
      if (update.width === undefined) restoreWidth();
      else this.width(update.width);
      for (const part of parts) {
        yield* part.node.opacity(
          part.opacity,
          (duration * 0.3) / parts.length,
          easing,
        );
      }
    } finally {
      restoreHeight();
      if (!committed || update.width === undefined) restoreWidth();
      for (const part of parts) part.restore();
    }
  }

  private textChanges(update: CardTextUpdate) {
    const header = this.children().find(child => child instanceof CardHeader);
    const content = this.children().find(child => child instanceof CardContent);
    const footer = this.children().find(child => child instanceof CardFooter);
    const slots = [
      [
        header?.children().find(child => child instanceof CardTitle),
        update.title,
      ],
      [
        header?.children().find(child => child instanceof CardDescription),
        update.description,
      ],
      [content?.children().find(child => child instanceof Txt), update.content],
      [footer?.children().find(child => child instanceof Txt), update.footer],
    ] as const;
    const changes: {node: Txt; text: string}[] = [];
    for (const [node, text] of slots) {
      if (text === undefined) continue;
      if (!node) {
        throw new Error('Card.changeText requires a matching text part.');
      }
      changes.push({node, text});
    }
    return changes;
  }

  private *resizeParts(
    duration: number,
    update: () => void,
    easing: TimingFunction,
  ): ThreadGenerator {
    const parts = this.children().filter(
      (child): child is Layout =>
        child instanceof Layout && child.layoutEnabled(),
    );
    const restore: (() => void)[] = [];
    const before = new Map(parts.map(part => [part, part.size()]));
    const motions: {part: Layout; from: Vector2; to: Vector2}[] = [];
    try {
      yield* all(
        this.editLayout(
          duration,
          () => {
            update();
            const active = parts.filter(part => part.layoutEnabled());
            restore.push(
              ...active.flatMap(part => [
                preserveSignal(part.width),
                preserveSignal(part.height),
              ]),
            );
            const sizes = active.map(part => part.size());
            // Keep child frames aligned with the card while editLayout
            // temporarily makes them independent layout roots.
            active.forEach((part, index) => {
              const from = before.get(part);
              const to = sizes[index];
              if (from) motions.push({part, from, to});
              part.size(to);
            });
          },
          easing,
        ),
        tween(duration, value => {
          for (const {part, from, to} of motions) {
            part.size(Vector2.lerp(from, to, easing(value)));
          }
        }),
      );
    } finally {
      for (const property of restore) property();
    }
  }

  private revealParts() {
    const header = this.children().find(child => child instanceof CardHeader);
    const nodes: Node[] = [];
    nodes.push(
      ...this.children().filter(
        child => child instanceof CardImage && child.visible(),
      ),
    );
    if (header) {
      nodes.push(
        ...header.children().filter(child => child instanceof CardTitle),
      );
      nodes.push(
        ...header.children().filter(child => child instanceof CardDescription),
      );
      nodes.push(
        ...header.children().filter(child => child instanceof CardAction),
      );
    }
    nodes.push(
      ...this.children().filter(child => child instanceof CardContent),
    );
    nodes.push(
      ...this.children().filter(
        child => child instanceof CardFooter && child.visible(),
      ),
    );
    return nodes.map(node => ({
      node,
      opacity: node.opacity(),
      restore: preserveSignal(node.opacity),
    }));
  }

  protected getDefaultSpacing(): number {
    const theme = this.theme();
    return this.variant() === 'sm' ? theme.padding.small : theme.padding.medium;
  }

  protected getDefaultFill(): string {
    return this.theme().colors.surface;
  }

  protected getDefaultStroke(): string {
    return this.theme().colors.border;
  }

  protected getDefaultFontFamily(): string {
    return this.theme().typography.fontFamily;
  }

  protected getDefaultFontSize(): number {
    return this.theme().typography.body;
  }

  protected override drawChildren(context: CanvasRenderingContext2D): void {
    context.save();
    if (this.clip() && this.stroke() !== null && this.lineWidth() > 0) {
      // Keep child surfaces inside the border's inner edge.
      const inset = this.lineWidth() / 2;
      const radius = this.radius();
      const path = new Path2D();
      drawRoundRect(
        path,
        this.childrenBBox().addSpacing(-inset),
        new Spacing(
          Math.max(0, radius.top - inset),
          Math.max(0, radius.right - inset),
          Math.max(0, radius.bottom - inset),
          Math.max(0, radius.left - inset),
        ),
        this.smoothCorners(),
        this.cornerSharpness(),
      );
      context.clip(path);
    }
    super.drawChildren(context);
    context.restore();
  }
}

/**
 * An image frame placed before the card header. Hidden images take no space.
 * Native `src`, `alpha`, dimensions, and smoothing remain available.
 *
 * @example
 * ```tsx
 * <Card width={720}>
 *   <CardImage src={cornellBox} height={300} fit="contain" visible={false} />
 *   <CardHeader><CardTitle text="Graphics test scenes" /></CardHeader>
 * </Card>
 * ```
 */
@nodeName('CardImage')
export class CardImage extends Img {
  /** Whether the image occupies layout space and is drawn by default. */
  @initial(true)
  @signal()
  declare public readonly visible: SimpleSignal<boolean, this>;

  /** Fill the frame by cropping, or contain the whole image with empty edges. */
  @initial('cover')
  @signal()
  declare public readonly fit: SimpleSignal<CardImageFit, this>;

  public constructor(props: CardImageProps) {
    super({width: '100%', height: 320, shrink: 0, ...props});
  }

  protected getDefaultOpacity(): number {
    return this.visible() ? 1 : 0;
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.visible() ? null : false;
  }

  protected getDefaultFill(): string {
    return themeOf(this).colors.crust;
  }

  protected override applyFlex(): void {
    super.applyFlex();
    this.yogaNode.setAspectRatio(this.ratio() ?? undefined);
  }

  protected override draw(context: CanvasRenderingContext2D): void {
    this.drawShape(context);
    const image = this.image();
    if (this.alpha() > 0 && image.naturalWidth > 0 && image.naturalHeight > 0) {
      const scale = (this.fit() === 'cover' ? Math.max : Math.min)(
        this.width() / image.naturalWidth,
        this.height() / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.save();
      context.clip(this.getPath());
      context.globalAlpha *= this.alpha();
      context.imageSmoothingEnabled = this.smoothing();
      context.drawImage(image, -width / 2, -height / 2, width, height);
      context.restore();
    }
    if (this.clip()) context.clip(this.getPath());
    this.drawChildren(context);
  }
}

/**
 * A stacked heading with room reserved for an optional top-right action.
 *
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle text="Anticipation" />
 *   <CardDescription text="Prepare the viewer for the next action." />
 *   <CardAction><Txt text="02 / 12" /></CardAction>
 * </CardHeader>
 * ```
 */
@nodeName('CardHeader')
export class CardHeader extends Layout {
  public constructor(props: LayoutProps = {}) {
    super({
      layout: true,
      direction: 'column',
      gap: () => themeOf(this).spacing.small / 2,
      padding: () => {
        const action = this.children().find(
          child => child instanceof CardAction,
        );
        const spacing = spacingOf(this);
        return [
          0,
          spacing + (action ? action.width() + this.columnGap() : 0),
          0,
          spacing,
        ];
      },
      minHeight: () => {
        const action = this.children().find(
          child => child instanceof CardAction,
        );
        return action?.height() ?? 0;
      },
      ...props,
    });
    rememberDefaults(this, props, ['gap', 'padding', 'minHeight']);
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.children().some(hasContent) ? null : false;
  }
}

/**
 * Wrapping title text using the nearest card's title token.
 *
 * @example
 * ```tsx
 * <CardTitle text={() => principleName()} />
 * ```
 */
@nodeName('CardTitle')
export class CardTitle extends Txt {
  public constructor(props: TxtProps = {}) {
    super({textWrap: true, fontWeight: 600, ...props});
  }

  protected getDefaultFill(): string {
    return themeOf(this).colors.foreground;
  }

  protected getDefaultFontSize(): number {
    return themeOf(this).typography.title;
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.text().trim() ? null : false;
  }
}

/**
 * Wrapping helper text using the nearest card's muted color.
 *
 * @example
 * ```tsx
 * <CardDescription text="A short pause makes the next movement easier to read." />
 * ```
 */
@nodeName('CardDescription')
export class CardDescription extends Txt {
  public constructor(props: TxtProps = {}) {
    super({textWrap: true, ...props});
  }

  protected getDefaultFill(): string {
    return themeOf(this).colors.muted;
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.text().trim() ? null : false;
  }
}

/**
 * An out-of-flow action aligned to its CardHeader's top-right inset.
 *
 * @example
 * ```tsx
 * <CardAction><Txt text="02 / 12" fontSize={24} /></CardAction>
 * ```
 */
@nodeName('CardAction')
export class CardAction extends Layout {
  public constructor(props: LayoutProps = {}) {
    super({
      layout: true,
      layoutSelf: false,
      position: () => {
        const parent = this.parent();
        if (!(parent instanceof Layout)) return [0, 0];
        return [
          (parent.width() - this.width()) / 2 - spacingOf(this),
          (this.height() - parent.height()) / 2 + parent.padding.top(),
        ];
      },
      ...props,
    });
    rememberDefaults(this, props, ['position']);
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }
}

/**
 * Main content area. Accepts arbitrary native nodes and layout props.
 *
 * @example
 * ```tsx
 * <CardContent direction="column" gap={16}>
 *   <Txt text="A ball dips down before it jumps." />
 * </CardContent>
 * ```
 */
@nodeName('CardContent')
export class CardContent extends Layout {
  public constructor(props: LayoutProps = {}) {
    super({
      layout: true,
      direction: 'column',
      padding: () => [0, spacingOf(this)],
      ...props,
    });
    rememberDefaults(this, props, ['padding']);
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.children().some(hasContent) ? null : false;
  }
}

/**
 * Inset footer actions on a muted surface with a top divider.
 *
 * @example
 * ```tsx
 * <CardFooter><Txt text="Animation principle · 02 / 12" /></CardFooter>
 * ```
 */
@nodeName('CardFooter')
export class CardFooter extends Rect {
  /** Whether the footer occupies layout space and is drawn by default. */
  @initial(true)
  @signal()
  declare public readonly visible: SimpleSignal<boolean, this>;

  public constructor(props: CardFooterProps = {}) {
    super({
      layout: true,
      alignItems: 'center',
      padding: () => spacingOf(this),
      ...props,
    });
    rememberDefaults(this, props, ['padding']);
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(instanceProps(this, props));
  }

  protected getDefaultFill(): string {
    return themeOf(this).colors.mantle;
  }

  protected getDefaultFontSize(): number {
    return themeOf(this).typography.caption;
  }

  protected getDefaultOpacity(): number {
    return this.visible() ? 1 : 0;
  }

  protected getDefaultLayoutSelf(): boolean | null {
    return this.visible() ? null : false;
  }

  protected override draw(context: CanvasRenderingContext2D): void {
    super.draw(context);
    context.beginPath();
    context.moveTo(-this.width() / 2, -this.height() / 2);
    context.lineTo(this.width() / 2, -this.height() / 2);
    context.strokeStyle = themeOf(this).colors.border;
    context.lineWidth = 2;
    context.stroke();
  }
}
