## Ink arrow

Inspired by [Remocn’s Ink Arrow](https://remocn.dev/docs/effects/ink-arrow),
this native node draws a curved, tapered brush stroke followed by two open
arrowhead arms. A seed fixes the curve wobble and brush edges across frames and
replay.

```tsx
<InkArrow ref={arrow} from={[-300, 80]} to={[300, -80]} />
```

Endpoints use the node's local coordinates. Native `position`, `rotation`, and
`scale` place the arrow in a scene. The curve and head contribute to its cache
bounds, so negative coordinates and large bows remain visible. Equal endpoints
draw nothing. The arrow adds no layout wrapper or internal nodes; cloning
preserves its native signal bindings.

## Props

| Prop           | Default          | Meaning                                                                          |
| -------------- | ---------------- | -------------------------------------------------------------------------------- |
| `from`, `to`   | Required         | Local endpoints; native vector inputs and reactive bindings are supported.       |
| `curvature`    | `0.35`           | Perpendicular bow relative to endpoint distance; negative bends the other way.   |
| `color`        | Theme foreground | Brush canvas style.                                                              |
| `strokeWidth`  | `8`              | Nominal brush width, in scene units.                                             |
| `pressure`     | `0.2`            | Opening width as a fraction of stroke width.                                     |
| `release`      | `1`              | Width at the tip; the shaft tapers between pressure and release.                 |
| `grain`        | `1`              | Seeded edge irregularity; zero gives clean edges. Values above three are capped. |
| `headSize`     | `24`             | Arm length, enlarged when necessary to fit the brush width.                      |
| `seed`         | `"arrow"`        | Curve and brush seed.                                                            |
| `step`         | `0.1`            | Seconds per animation pose; zero makes the animation smooth.                     |
| `progress`     | `0`              | Shaft completion, clamped to 0–1 for rendering.                                  |
| `headProgress` | `0`              | Head completion; each half draws one arm, after the shaft reaches one.           |
| `theme`        | `defaultTheme`   | Ink color and animation duration defaults.                                       |

All props accept core signal bindings. Grain uses native brush-edge geometry; it
does not require the reference's SVG noise filter. Textures and paths remain
stable between poses.

## Animation

```ts
yield * arrow().reveal();
yield * arrow().erase();
arrow().curvature(-0.35);
yield * arrow().reveal(2);
```

`reveal(duration?, easing?)` resets both progress signals, draws the shaft over
75% of the duration, then draws the head arms over the remaining 25%.
`erase(duration?, easing?)` retracts the head first, then the shaft. They
default to twice the theme's long duration and the long duration respectively,
with linear easing. Cancelling leaves the current pose. Zero-duration calls
apply the final state immediately. The constructor starts no threads.

The reference's frame clock is expressed in seconds here. The default 0.1-second
step corresponds to three frames at 30 fps; it remains the same tempo at other
project frame rates. Use a scene's `waitFor` before `reveal` for a delay. Direct
progress animations bypass pose quantization so they can share signals with
other components. `pointAt(t)` returns a point on the complete cubic shaft for
positioning labels or markers.
