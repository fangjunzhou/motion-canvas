## Layouts

Use `TitleSlide` to open a presentation, `SectionSlide` between sections,
`ContentSlide` for a heading above native scene content, and `BlankSlide` for
custom layouts. All four extend `Slide`, a native `Rect` with a reactive
`variant` signal. The variants are `title`, `section`, `content`, and `blank`.

```tsx
<ContentSlide
  title="Shared progress"
  subtitle="One signal updates the label, bar, and curve."
  size={() => view.size()}
>
  <Layout grow={1}>
    <Progress value={() => progress() * 100} />
  </Layout>
</ContentSlide>
```

Pass native nodes through JSX children or the constructor's `children` prop.
They go into a vertical content layout. Content and blank slides give that
layout the remaining height; title and section slides center their heading,
subtitle, and any content as a group. Add a native `Layout` inside the slide for
columns, alignment, or other arrangements. Set text colors explicitly on custom
content. Empty titles and subtitles occupy no space.

## Keynote reference

The sizing reference is the White widescreen template bundled with Apple Keynote
at `Contents/SharedSupport/Templates/White/Wide.kth`. Its canvas is 1920 × 1080.
Its text styles include Title at 112, Title Small at 84, Subtitle at 54, Body at
48, Label at 32, and Caption at 30. These are measurements from that template,
which uses Helvetica Neue. Other Keynote themes can use different settings.

Motion Kit uses those presentation, body, label, and caption sizes with its
portable sans-serif font. Component titles use 54. Presentation title slides use
`display`; content and section headings use `heading`. Centered subtitles use
`subtitle`; the short description beneath a content slide's heading uses `body`.

Apple describes how to
[choose a slide size](https://support.apple.com/en-ca/guide/keynote/tan929f13a1f/mac)
and
[customize slide layouts](https://support.apple.com/en-au/guide/keynote/tan7a2b69972/mac).
The component follows the same idea of reusable layouts with editable text and
content. It does not import Keynote files.

## Props and defaults

`title`, `subtitle`, `variant`, and `theme` accept core signal bindings.
Replacing the theme updates fonts, colors, padding, and gaps without rebuilding
the slide. Defaults come from `defaultTheme`; canvas dimensions default to
`PresentationSize.width` (1920) and `.height` (1080).

The frame uses `theme.padding.large`, the space below its header uses
`theme.spacing.medium`, and the title/subtitle gap uses `theme.spacing.small`.
Native dimensions, padding, gap, fill, font, transform, and layout props remain
available. Explicit root `fontSize` applies to content; heading sizes come from
the theme. Pass `padding={0}` for an edge-to-edge blank slide.

Use `size={() => view.size()}` to follow a project's canvas. Dimensions use
scene units, and font sizes stay at the theme's values when the canvas changes.
Cloning rebuilds the internal heading and content wrapper, clones public
content, and binds the copy's text and theme to its own signals.

The public `heading` and `subtitleHeading` text nodes and `content` layout allow
scene-scheduled text morphs and content fades without reconstructing the frame.
For example, `yield* slide.heading.text("Next topic", 0.45)` carries the
existing heading into the next step while `slide.content.opacity(...)` controls
its body.

## Transitions

Slides start fully visible and create no animation threads. Set `opacity={0}`
and schedule a component method or native animation from the scene. The example
uses `swipeIn()` and `swipeOut()` for each layout. The showcase's opening title
uses both methods; its content scenes retain their fade transitions.

## Heading entrance

`enter(duration?, easing?)` fades in the frame, then moves and fades the title,
subtitle, and content into place in order. Empty headings are skipped. The whole
sequence uses the supplied duration and the slide's motion defaults. It animates
native translation, so the layout stays fixed. Repeating the method restarts the
entrance; zero duration reveals it immediately. Cancelling restores opacity and
translation bindings. Scene transitions remain controlled by the calling scene.

## Swipe transitions

`swipeIn(duration?, easing?)` fades in the frame, then reveals the title,
subtitle, and content with accent-colored wipes. `swipeOut(duration?, easing?)`
wipes those same sections away in the same order, then fades out the frame. Each
wipe starts a little after the previous one, with a gap of
`theme.motion.short / 2` (0.1 seconds by default). The gap shortens when needed
to keep the whole sequence within the supplied duration. Both methods default to
`theme.motion.long`; entrance easing comes from `theme.motion.enter` and exit
easing from `theme.motion.exit`. The wipe fits the text glyphs and leaves layout
positions unchanged. The method is shared by `TitleSlide`, `SectionSlide`,
`ContentSlide`, and `BlankSlide`. Empty headings are skipped; all public content
wipes as one group. Images finish loading before the animation starts.

Child opacity bindings are restored after each transition, so the same slide can
enter and exit again. Zero duration applies the final state immediately.
Cancelling removes the wipe overlays and restores the original opacity bindings.
