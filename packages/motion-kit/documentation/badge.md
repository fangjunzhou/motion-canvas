## Usage

Badge is a native `Rect` with a reactive text label. It follows the variant
names in the [shadcn/ui Badge](https://ui.shadcn.com/docs/components/base/badge)
API: `default`, `secondary`, `destructive`, `outline`, `ghost`, and `link`.

Use `text` for the label, `variant` for its appearance, and `theme` for its
Catppuccin colors. All three accept core signal bindings. The default theme is
Mocha. `textColor` overrides the label color; native `fill` and `stroke`
override the background and border. Native font, size, transform, and layout
props remain available. The label uses `theme.typography.label` (22), stays on
one line, and the badge sizes to its content. Padding, border width, and pill
shape have built-in defaults; native props can override them.

Children appear before the label, so a native icon or spinner can sit beside the
text. Animate those children from the scene. Use `direction="row-reverse"` to
place them after the label. Each instance owns its signals, and `clone()`
creates a label bound to the copy.

The `link` variant applies accent text styling. Scene nodes do not navigate or
have browser hover and focus states. Badge starts no threads during
construction.

## Animation

The scene schedules `enter()`, `exit()`, `emphasize()`, and `changeText()` with
`yield*`. Each accepts a total duration in seconds and an optional core timing
function. Defaults come from the theme's medium duration and corresponding
easing.

`enter` fades from zero opacity to one. Set `opacity={0}` initially to keep a
badge hidden before calling it. `exit` fades to zero and keeps the layout space.
`emphasize` enlarges the current scale by 12%, then returns to its original
value. It restores the original scale binding, including when cancelled.

`changeText('Complete')` fades out the label, resizes the badge's width,
replaces the text, and fades the label back in. Pass
`{text: 'Complete', variant: 'default'}` to change the variant at the same time.
Icons remain visible. The old text stays unchanged until resizing finishes.
Height stays in its original layout mode to avoid shifting the badge or its
container through pixel rounding. Width and label opacity bindings are restored
after completion or cancellation; committed text and variant changes remain.
Fixed dimensions and parent constraints still apply.

Zero-duration calls apply their final state immediately. Repeated `enter` calls
replay the reveal, and pulses preserve the badge's current scale. Schedule
methods on the same badge in sequence. The composition demo uses animated status
changes and pulses the active motion-phase badge.
