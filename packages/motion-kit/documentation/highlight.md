## Text marker

Highlight draws a straight marker behind native text by default, following
[Remocn’s Marker Highlight](https://remocn.dev/docs/typography/marker-highlight).
Set `style="hand-drawn"` for the seeded brush strokes. It follows the
progress-driven approach of
[Remotion’s Text Marker](https://www.remotion.dev/elements/text/text-marker/)
and [Highlight API](https://www.remotion.dev/docs/rough-notation/highlight). It
uses native Canvas Commons text measurement and canvas paths, with no React,
Remotion, browser DOM measurement, or font-download dependency.

```tsx
<Highlight
  ref={marker}
  text="A truly remarkable result."
  selection="remarkable"
  color="rgba(255, 236, 79, 0.62)"
  markerPadding={[0, 20]}
  progress={0}
/>
```

Highlight extends `Txt`. Set `text`, or pass native text children as with `Txt`.
Use Highlight as the paragraph's root rather than nesting it inside another
`Txt`: the root paints the marker before the text. To annotate one phrase in a
sentence, put the complete sentence in Highlight and set `selection` to the
phrase. The first exact match is selected. `selection={null}` marks all text; an
empty or absent match draws no marker. Text on a curved path is not annotated.

Wrapped selections produce a separate stroke for each line, in reading order.
Changing the text, width, font, or selection remeasures the marker. Progress and
marker padding never change the text's dimensions or surrounding layout.

## Props

| Prop                  | Default        | Meaning                                                                                |
| --------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `style`               | `"straight"`   | A single rectangular wipe, or `"hand-drawn"` brush passes.                             |
| `progress`            | `0`            | Amount drawn, clamped to 0–1. Non-finite values draw nothing.                          |
| `selection`           | `null`         | First matching phrase, or the whole paragraph.                                         |
| `color`               | Theme yellow   | Marker canvas style; native `fill` controls text color.                                |
| `markerPadding`       | `0`            | Native spacing syntax for marker outsets. Native `padding` still controls text layout. |
| `iterations`          | `2`            | Passes per line, floored and bounded to 0–16. Alternating passes reverse direction.    |
| `seed`                | `1`            | Stable stroke variation across frames, clones, and replay.                             |
| `roughness`           | `3`            | Irregularity of the marker edges; zero gives smooth edges.                             |
| `maxRandomnessOffset` | `5`            | Edge variation in scene units, scaled by roughness and limited by line height.         |
| `bowing`              | `1`            | Curve of the stroke edges; zero makes the base stroke straight.                        |
| `rtl`                 | `false`        | Start each line's first pass at the right edge.                                        |
| `disabled`            | `false`        | Hide only the marker while keeping text visible.                                       |
| `theme`               | `defaultTheme` | Text typography, foreground, yellow marker, and motion defaults.                       |

These props accept core signal bindings. Straight markers have flat edges and
reveal once per line in the `rtl` direction. `iterations`, `seed`, `roughness`,
`maxRandomnessOffset`, and `bowing` affect only the hand-drawn style. Switch
styles while erased to keep the transition clear:

```ts
yield * marker().erase();
marker().style('hand-drawn');
yield * marker().reveal();
```

This is a native marker implementation; the hand-drawn style’s seeded brush
geometry is independent of Rough.js and differs from Remotion's. Use a
translucent `color` for overlapping marker passes. No new theme tokens are
needed. `markerBoxes()` returns the padded line rectangles in text-local units.

## Animation

```ts
yield * marker().reveal();
yield * marker().erase();
yield * marker().progress(0.6, 0.8);
```

`reveal(duration?, easing?)` starts at zero and draws to one using the theme's
long duration and enter easing. `erase(duration?, easing?)` retracts from the
current progress to zero using the medium duration and exit easing. Text stays
visible. Zero-duration calls apply immediately; cancellation keeps the current
progress. Construction starts no threads. Native cloning preserves independent
signals and text bindings; no internal marker nodes are added.
