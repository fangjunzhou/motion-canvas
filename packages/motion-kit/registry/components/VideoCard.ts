import {
  Rect,
  Video,
  initial,
  nodeName,
  signal,
  type NodeState,
  type VideoProps,
} from '@canvas-commons/2d';
import {
  PlaybackState,
  all,
  useThread,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps,
} from './Card';

export interface CardVideoProps extends VideoProps {
  fit?: SignalValue<'cover' | 'contain'>;
  loopStart?: SignalValue<number>;
  muted?: SignalValue<boolean>;
}
/** Native video with aspect-preserving fitting and an optional post-intro loop. */
@nodeName('CardVideo')
export class CardVideo extends Video {
  @initial('cover') @signal() declare public readonly fit: SimpleSignal<
    'cover' | 'contain',
    this
  >;
  @initial(0) @signal() declare public readonly loopStart: SimpleSignal<
    number,
    this
  >;
  @initial(true) @signal() declare public readonly muted: SimpleSignal<
    boolean,
    this
  >;
  public constructor(props: CardVideoProps = {}) {
    super({loop: true, ...props});
  }
  /**
   * Keep playback on the scene clock after a clip-change task completes.
   * Pause explicitly when the owning slide or animation finishes.
   * @example
   * ```ts
   * yield card.video.toPromise();
   * card.video.play();
   * ```
   */
  public override play(): void {
    const time = useThread().root.time;
    const start = time();
    const offset = this.time();
    const rate = this.playbackRate();
    this.playing(true);
    this.time(() => this.clampTime(offset + (time() - start) * rate));
  }
  protected override setPlaybackRate(rate: number): void {
    super.setPlaybackRate(rate);
    if (this.isPlaying()) this.play();
  }
  public override clampTime(time: number): number {
    const duration = this.getDuration();
    const start = this.loopStart();
    if (this.loop() && start > 0 && start < duration && time >= duration) {
      return start + ((time - duration) % (duration - start));
    }
    return super.clampTime(time);
  }
  protected override fastSeekedVideo(): HTMLVideoElement {
    const video = this.video();
    video.muted = this.muted();
    if (
      this.loop() &&
      this.isPlaying() &&
      video.ended &&
      this.getCurrentTime() >= video.duration - 0.2
    ) {
      return video;
    }
    return super.fastSeekedVideo();
  }
  protected override draw(context: CanvasRenderingContext2D): void {
    this.drawShape(context);
    if (this.alpha() > 0) {
      const state = this.view().playbackState();
      const video =
        state === PlaybackState.Playing || state === PlaybackState.Presenting
          ? this.fastSeekedVideo()
          : this.seekedVideo();
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const scale = (this.fit() === 'cover' ? Math.max : Math.min)(
          this.width() / video.videoWidth,
          this.height() / video.videoHeight,
        );
        const width = video.videoWidth * scale,
          height = video.videoHeight * scale;
        context.save();
        context.clip(this.getPath());
        context.globalAlpha *= this.alpha();
        context.imageSmoothingEnabled = this.smoothing();
        context.drawImage(video, -width / 2, -height / 2, width, height);
        context.restore();
      }
    }
    if (this.clip()) context.clip(this.getPath());
    this.drawChildren(context);
  }
}

export interface VideoCardProps extends CardProps {
  src: SignalValue<string>;
  title?: SignalValue<string>;
  description?: SignalValue<string>;
  /** Cover height in pixels, or null to fill the space around natural-height text. */
  mediaHeight?: SignalValue<number | null>;
  fit?: SignalValue<'cover' | 'contain'>;
}
export interface VideoClip {
  src: string;
  title?: string;
  description?: string;
}
/** A full-width video cover and themed card header, controlled by the scene. */
@nodeName('VideoCard')
export class VideoCard extends Card {
  @initial('') @signal() declare public readonly src: SimpleSignal<
    string,
    this
  >;
  @initial('cover') @signal() declare public readonly fit: SimpleSignal<
    'cover' | 'contain',
    this
  >;
  @initial('') @signal() declare public readonly title: SimpleSignal<
    string,
    this
  >;
  @initial('') @signal() declare public readonly description: SimpleSignal<
    string,
    this
  >;
  @initial(280) @signal() declare public readonly mediaHeight: SimpleSignal<
    number | null,
    this
  >;
  public readonly video: CardVideo;
  private readonly header: CardHeader;
  public constructor({children, ...props}: VideoCardProps) {
    super({padding: 0, gap: 0, ...props});
    const viewport = new Rect({
      layout: true,
      width: '100%',
      height: () => this.mediaHeight() ?? 0,
      grow: () => (this.mediaHeight() === null ? 1 : 0),
      minHeight: 0,
      shrink: 0,
      clip: true,
      fill: () => this.theme().colors.crust,
    });
    this.video = new CardVideo({
      src: () => this.src(),
      fit: () => this.fit(),
      layout: false,
      width: '100%',
      height: '100%',
    });
    viewport.add(this.video);
    this.header = new CardHeader({
      padding: () => this.theme().padding.medium,
      shrink: 0,
      children: [
        new CardTitle({text: () => this.title()}),
        new CardDescription({
          text: () => this.description(),
          fontSize: () => this.theme().typography.caption,
        }),
      ],
    });
    this.header.layoutSelf(() =>
      this.title() || this.description() ? null : false,
    );
    this.add([viewport, this.header]);
    if (children) this.add(children);
  }
  /**
   * Load a new clip while hidden, then resume with its title and description.
   * @example
   * ```ts
   * yield* card().changeClip({src: '/clips/next.mp4'});
   * ```
   */
  public *changeClip(
    clip: VideoClip,
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const videoOpacity = this.video.opacity.context.raw();
    const headerOpacity = this.header.opacity.context.raw();
    try {
      yield* all(
        this.video.opacity(0, duration / 2, easing),
        this.header.opacity(0, duration / 2, easing),
      );
      this.video.pause();
      this.src(clip.src);
      this.title(clip.title ?? this.title());
      this.description(clip.description ?? this.description());
      yield this.video.toPromise();
      this.video.seek(0);
      this.video.play();
      yield* all(
        this.video.opacity(1, duration / 2, easing),
        this.header.opacity(1, duration / 2, easing),
      );
    } finally {
      if (videoOpacity === undefined) this.video.opacity.reset();
      else this.video.opacity(videoOpacity);
      if (headerOpacity === undefined) this.header.opacity.reset();
      else this.header.opacity(headerOpacity);
    }
  }
  /**
   * Collapse only the cover; text and the card's layout remain available.
   * @example
   * ```ts
   * yield* card().hideMedia();
   * ```
   */
  public *hideMedia(
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.exit,
  ): ThreadGenerator {
    const height = this.video.height();
    const videoHeight = this.video.height.context.raw();
    if (this.mediaHeight() === null) this.mediaHeight(height);
    this.video.height(height);
    try {
      yield* all(
        this.mediaHeight(0, duration, easing),
        this.video.opacity(0, duration, easing),
      );
    } finally {
      if (videoHeight === undefined) this.video.height.reset();
      else this.video.height(videoHeight);
    }
  }
  /**
   * Rebuild the media and header against the clone's own signals.
   * Playback is controlled independently by the calling scene.
   * @example
   * ```ts
   * const copy = card().clone({title: 'Another view'});
   * ```
   */
  public override clone(props: NodeState = {}): this {
    const clone = super.clone({children: [], ...props});
    clone.video.loopStart(this.video.loopStart.context.raw() ?? 0);
    clone.video.muted(this.video.muted.context.raw() ?? true);
    return clone;
  }
  public override dispose(): void {
    if (this.isDisposed) return;
    this.video.pause();
    super.dispose();
  }
}
