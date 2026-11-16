## Composition

`VideoCard` extends `Card` and composes a clipped `CardVideo` cover with
`CardHeader`, `CardTitle`, and `CardDescription`. Set native width or flex
growth on the card; `mediaHeight` controls the cover height independently. Set
`mediaHeight={null}` in a stretched or fixed-height card to let the video fill
the remaining height. The title and description keep their natural height, theme
typography, and padding, with no unused space below them. `src`, `title`,
`description`, `mediaHeight`, and `theme` support native signal bindings. An
empty title and description omit the header and its layout space. The public
`video` node exposes native playback, seeking, alpha, transforms, and looping.

`CardVideo` extends native `Video`. Its `fit` signal is `cover` or `contain`,
preserving the source aspect ratio. `loopStart` defaults to zero; a value inside
the clip duration plays the full introduction once and loops the remaining
section. Ended native playback waits for the scene clock to wrap instead of
restarting ahead of time. Playback is muted by default so embedded previews can
autoplay. Set `card.video.muted(false)` when sound is wanted and playback
follows a user gesture.

## Animation and resources

Yield `card.video.toPromise()` before playback, then call `card.video.play()`.
`CardVideo` binds playback to the scene's root clock, so finishing a short clip
change or concurrent animation keeps the video moving. Pause it when a
background animation is cancelled or the slide finishes. Disposing a video card
pauses playback.

`yield* card.changeClip({src, title?, description?}, duration?, easing?)` fades,
loads, seeks, and resumes a clip with matching captions.
`yield* card.hideMedia(duration?, easing?)` collapses the cover while keeping
the header. A filling cover collapses from its resolved height, rather than
jumping from an automatic height to zero. Explicit card heights and flex sizing
remain in effect. To shrink a fixed-height card with its cover, first set
`card.mediaHeight(card.video.height())` and `card.height.reset()`, as in the
example. Constructors start no threads. The calling scene controls duration and
concurrency; avoid overlapping methods on the same properties. The example
embeds an original synthetic FFmpeg color clip, so the preview needs no external
media.

Native children append below the built-in header. Cloning reconstructs the cover
and header against the clone's own source, fitting, and text signals; the caller
starts playback independently. Clip changes restore visibility bindings on
cancellation, while keeping any source and caption already committed.
