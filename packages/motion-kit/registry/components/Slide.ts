import {
  Layout,
  Rect,
  Txt,
  initial,
  nodeName,
  signal,
  type NodeProps,
  type NodeState,
  type RectProps,
} from '@canvas-commons/2d';
import {
  CompoundSignalContext,
  isReactive,
  type SignalValue,
  type SimpleSignal,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';

/** Standard presentation layouts. */
export type SlideVariant = 'title' | 'content' | 'section' | 'blank';

/** Native rectangle props with reactive presentation text, layout, and theme. */
export interface SlideProps extends RectProps {
  title?: SignalValue<string>;
  subtitle?: SignalValue<string>;
  variant?: SignalValue<SlideVariant>;
  theme?: SignalValue<MotionTheme>;
}

/** Keynote White's widescreen canvas, in scene units. */
export const PresentationSize = Object.freeze({width: 1920, height: 1080});

/**
 * A presentation frame with a heading area and native children as its content.
 * Text and layout follow the theme; the calling scene controls transitions.
 *
 * @example
 * ```tsx
 * <ContentSlide title="Rendering" subtitle="Follow the light through a scene.">
 *   <Txt text="Light reflects from one surface to the next." />
 * </ContentSlide>
 * ```
 */
@nodeName('Slide')
export class Slide extends Rect {
  @initial('')
  @signal()
  declare public readonly title: SimpleSignal<string, this>;

  @initial('')
  @signal()
  declare public readonly subtitle: SimpleSignal<string, this>;

  @initial('content')
  @signal()
  declare public readonly variant: SimpleSignal<SlideVariant, this>;

  @initial(defaultTheme)
  @signal()
  declare public readonly theme: SimpleSignal<MotionTheme, this>;

  private readonly content: Layout;
  private readonly defaultBindings = new Map<string, unknown>();

  public constructor({children, ...props}: SlideProps = {}) {
    super({
      size: [PresentationSize.width, PresentationSize.height],
      layout: true,
      direction: 'column',
      clip: true,
      lineWidth: 2,
      padding: () => this.theme().padding.large,
      gap: () => this.theme().spacing.medium,
      ...props,
    });
    const heading = new Txt({
      width: '100%',
      text: () => this.title(),
      textWrap: true,
      fontWeight: 600,
      fontSize: () =>
        this.variant() === 'title'
          ? this.theme().typography.display
          : this.theme().typography.heading,
      fill: () => this.theme().colors.foreground,
      textAlign: () => (this.variant() === 'content' ? 'left' : 'center'),
      opacity: () => (this.title() ? 1 : 0),
    });
    heading.layoutSelf(() => (this.title() ? null : false));
    const subtitle = new Txt({
      width: '100%',
      text: () => this.subtitle(),
      textWrap: true,
      fontSize: () =>
        this.variant() === 'content'
          ? this.theme().typography.body
          : this.theme().typography.subtitle,
      fill: () => this.theme().colors.muted,
      textAlign: () => (this.variant() === 'content' ? 'left' : 'center'),
      opacity: () => (this.subtitle() ? 1 : 0),
    });
    subtitle.layoutSelf(() => (this.subtitle() ? null : false));
    const header = new Layout({
      layout: true,
      direction: 'column',
      shrink: 0,
      gap: () => this.theme().spacing.small,
      opacity: () => (this.variant() === 'blank' ? 0 : 1),
      children: [heading, subtitle],
    });
    header.layoutSelf(() =>
      this.variant() === 'blank' || (!this.title() && !this.subtitle())
        ? false
        : null,
    );
    this.content = new Layout({
      layout: true,
      direction: 'column',
      grow: () => (this.centered() ? 0 : 1),
      basis: () => (this.centered() ? null : 0),
      minHeight: 0,
      children,
    });
    this.content.layoutSelf(() =>
      this.content.children().length ? null : false,
    );
    this.add([header, this.content]);

    const supplied = new Set(Object.keys(props));
    for (const {key, meta, signal} of this) {
      if (!['padding', 'gap'].includes(key) || supplied.has(key)) continue;
      if (!(signal.context instanceof CompoundSignalContext)) continue;
      for (const [entry, property] of signal.context.signals) {
        const name = meta.compoundEntries?.find(([key]) => key === entry)?.[1];
        if (name && !supplied.has(name)) {
          this.defaultBindings.set(name, property.context.raw());
        }
      }
    }
  }

  /**
   * Copy the slide's content into a fresh frame with its own heading bindings.
   * @example
   * ```ts
   * const next = slide.clone({title: 'The next step'});
   * ```
   */
  public override clone(props: NodeState = {}): this {
    const children = this.content.children.context.raw();
    return super.clone({
      children: isReactive(children)
        ? children
        : this.content.children().map(child => child.clone()),
      ...props,
    });
  }

  public override instantiate(props: NodeProps = {}): this {
    return super.instantiate(
      Object.fromEntries(
        Object.entries(props).filter(
          ([key, value]) =>
            !this.defaultBindings.has(key) ||
            this.defaultBindings.get(key) !== value,
        ),
      ),
    );
  }

  private centered(): boolean {
    return this.variant() === 'title' || this.variant() === 'section';
  }

  protected getDefaultJustifyContent(): 'center' | 'start' {
    return this.centered() ? 'center' : 'start';
  }

  protected getDefaultFill(): string {
    return this.theme().colors.background;
  }

  protected getDefaultFontFamily(): string {
    return this.theme().typography.fontFamily;
  }

  protected getDefaultFontSize(): number {
    return this.theme().typography.body;
  }
}

/**
 * Centered presentation title and subtitle, with optional content beneath them.
 * @example
 * ```tsx
 * <TitleSlide title="Light and motion" subtitle="A rendering study" />
 * ```
 */
@nodeName('TitleSlide')
export class TitleSlide extends Slide {
  public constructor(props: SlideProps = {}) {
    super({variant: 'title', ...props});
  }
}

/**
 * Top-aligned heading and subtitle with a content area that fills the remaining height.
 * @example
 * ```tsx
 * <ContentSlide title="Shared progress"><Progress value={50} /></ContentSlide>
 * ```
 */
@nodeName('ContentSlide')
export class ContentSlide extends Slide {
  public constructor(props: SlideProps = {}) {
    super({variant: 'content', ...props});
  }
}

/**
 * A centered section heading and optional subtitle between groups of content slides.
 * @example
 * ```tsx
 * <SectionSlide title="Lighting" subtitle="Start with a simple scene." />
 * ```
 */
@nodeName('SectionSlide')
export class SectionSlide extends Slide {
  public constructor(props: SlideProps = {}) {
    super({variant: 'section', ...props});
  }
}

/**
 * A padded presentation frame for custom diagrams, images, and other native content.
 * @example
 * ```tsx
 * <BlankSlide padding={0}><Img src={cover} size="100%" /></BlankSlide>
 * ```
 */
@nodeName('BlankSlide')
export class BlankSlide extends Slide {
  public constructor(props: SlideProps = {}) {
    super({variant: 'blank', ...props});
  }
}
