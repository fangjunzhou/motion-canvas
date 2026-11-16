## Composition

Inspired by
[shadcn/ui's Base Card](https://ui.shadcn.com/docs/components/base/card), these
are native Canvas Commons nodes. Import the parts from your copied
`components/Card.ts` source:

```text
Card
├── CardImage
├── CardHeader
│   ├── CardTitle
│   ├── CardDescription
│   └── CardAction
├── CardContent
└── CardFooter
```

All parts are optional. Empty or whitespace-only titles and descriptions leave
no layout space. `CardContent` also collapses when it has no children or only
empty text nodes, removing the section gap. Text bindings and `changeText()` can
restore those sections. Native `layoutSelf` overrides remain available for
intentionally empty layout areas. `Card` extends `Rect`; its direct children are
the public composition area. `CardContent` and `CardHeader` extend `Layout`,
`CardFooter` extends `Rect`, and both text parts extend `Txt`. Use native props
and refs to customize or animate them. Pass title and description strings
through `text`. Set colors explicitly on arbitrary content nodes; the text parts
inherit their semantic colors from the nearest card.

## Props and signals

| Card prop          | Default                                                       | Purpose                                                                 |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `theme`            | `defaultTheme` (Mocha)                                        | Reactive theme for surfaces, typography, and parts.                     |
| `variant`          | `"default"`                                                   | `"sm"` selects small padding and gap tokens.                            |
| `spacing`          | Theme `padding.medium` (32), or `padding.small` (16) for `sm` | Insets and footer padding; an explicit value also sets the section gap. |
| Native `RectProps` | Vertical layout, clipped, rounded, 2-unit border              | Dimensions, transforms, layout, styling, and children.                  |

The reference's `size="sm"` becomes `variant="sm"` because native `size`
controls the scene node's dimensions. The `spacing` signal defaults to the
theme's padding token. Section gaps use `theme.spacing.medium`, or `small` for
`sm`, independently of padding. Setting `spacing` explicitly applies that value
to both insets and section gaps, as a number or a core signal binding. Explicit
`gap`, `padding`, and per-side padding props override their corresponding
defaults.

Titles use `theme.typography.title` (54), content uses `body` (48), and footer
text uses `caption` (30). Native `fontSize` props override these defaults.

`CardHeader` reserves space for a direct `CardAction` child, aligned to its
top-right inset. Give the card a width so text can wrap into the remaining
space. Keep action content intrinsically sized. `CardFooter` adds an inset muted
surface and top divider, and removes the root's bottom padding when it is the
last child. A native `Img` placed first removes the root's top padding; set its
width to `"100%"` to create an edge-to-edge cover. The root clips covers to its
corners. Use native `textDirection="rtl"` for text; action placement stays on
the right.

The parts follow the nearest ancestor card when reparented. Changing a card's
theme, variant, or spacing updates its parts without reconstructing nodes. Each
instance owns its signals; theme presets remain immutable.

## Images

Place `CardImage` before the header. It extends native `Img`, so local asset
imports, `src` bindings, `alpha`, and smoothing work as usual. Its default frame
is the card's full width and 320 scene units high.

```tsx
<Card width={840}>
  <CardImage src={cornellBox} height={440} fit="cover" visible={false} />
  <CardHeader>
    <CardTitle text="Graphics test models" />
  </CardHeader>
</Card>
```

`fit="cover"` fills the frame and crops the image while preserving its aspect
ratio. `fit="contain"` shows the whole image, with the frame's fill visible at
the edges. Both modes use the frame's dimensions; changing source does not
stretch the image. The card clips the image to its rounded corners and keeps the
border visible.

Set `visible={false}` to start without an image or its layout space. Use
`showImage()` and `hideImage()` to expand or collapse that space with a fade.
`changeImage()` accepts a source string or a `CardImageUpdate` object with
`src`, optional frame `height`, optional card `width`, and an optional
`description` to replace alongside the image:

```ts
function* replaceCover(card: Card) {
  yield* card.showImage(0.8);
  yield* card.hideImage(0.8);
  yield* card.showImage(0.8);
  yield* card.changeImage({src: stanfordBunny, width: 560, height: 560}, 1.2);
}
```

The replacement loads before the timed animation starts. Card fades the old
image out, resizes the frame and card together, then reveals the replacement. A
width or description change also fades the text during reflow. The description
changes while the image and text are faded out, so the new label appears with
the new image. Specified dimensions become the new frame height and card width.
Cancelling before the resize finishes restores the original source, dimensions,
and description binding. A hidden image can change source and dimensions without
becoming visible.

The demo uses a local copy of
[Cornell Box multispectral imaging.png](https://commons.wikimedia.org/wiki/File:Cornell_Box_multispectral_imaging.png)
by Michal Czerniawski, based on Cornell University data
([CC0](https://creativecommons.org/publicdomain/zero/1.0/)), and
[Mesh bunny.png](https://commons.wikimedia.org/wiki/File:Mesh_bunny.png) by
G1malitm ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). The
bunny image retains its license. The source files are unchanged except for
Wikimedia's resized Cornell thumbnail; the demo crops them to fill the frame.

## Animation

Card starts fully visible and creates no animation threads in its constructor.
Set `opacity={0}` on a card you plan to introduce with `enter()`. Set
`visible={false}` on its `CardFooter` to leave out the footer and its layout
space until it is needed.

| Method                                    | What happens                                                                                                | Default duration |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------- |
| `enter(duration?, easing?)`               | Fade in the surface, any visible image, title, description, content, and any visible footer, in that order. | Theme `long`     |
| `showFooter(duration?, easing?)`          | Expand to fit the footer, then fade it in.                                                                  | Theme `medium`   |
| `hideFooter(duration?, easing?)`          | Fade out the footer, then close its layout space.                                                           | Theme `medium`   |
| `changeText(update, duration?, easing?)`  | Fade out the old text, resize, then replace and reveal the text in order.                                   | Theme `long`     |
| `showImage(duration?, easing?)`           | Expand to fit the image, then fade it in.                                                                   | Theme `medium`   |
| `hideImage(duration?, easing?)`           | Fade out the image, then close its layout space.                                                            | Theme `medium`   |
| `changeImage(update, duration?, easing?)` | Load, fade out, resize, then fade in the replacement.                                                       | Theme `long`     |

Durations cover the entire method and are measured in seconds. Each method
returns a core `ThreadGenerator`; the calling scene schedules it. Run methods on
the same card in sequence:

```ts
function* presentCard(card: Card) {
  yield* card.enter(1.2);
  yield* card.showFooter(0.8);
  yield* card.hideFooter(0.8);
  yield* card.changeText(
    {
      title: 'Follow-Through',
      description: 'Let the movement settle after the main action.',
      content: 'A loose coat keeps moving after the character stops.',
      footer: 'Animation principle · 05 / 12',
      width: 840,
    },
    1.8,
  );
  yield* card.showFooter(0.8);
}
```

`changeText` accepts optional `title`, `description`, `content`, `footer`, and
`width` fields. Title and description address the first matching direct children
of `CardHeader`. Content and footer address the first direct `Txt` in their
respective parts. Other children remain in place. A requested text field without
a matching node throws an error before animation starts.

Card measures the next layout on a temporary clone. The original text remains
unchanged until the resize finishes. The optional numeric `width` becomes the
new width; otherwise Card restores the original width binding. Height returns to
its original binding after the text changes. Use automatic height to let a card
grow or shrink to fit the new text; explicit dimensions and parent layout
constraints still apply.

Footer transitions preserve text wrapping while the card changes size. The
footer stays in the scene graph when hidden, so its text can be updated before
it reappears. `visible` is a core boolean signal on `CardFooter` and defaults to
`true`. `showFooter` and `hideFooter` do nothing when the footer already has the
requested visibility or the card has no footer.

Calling `enter` again replays the reveal. Missing reveal parts are skipped.
Zero-duration calls apply their final state immediately once any required image
has loaded. Part opacity bindings and temporary size overrides are restored if a
method is cancelled; text already committed by `changeText` and visibility
already set by a footer transition stay in place. The scene controls replay and
seeking, as with other native animations.
