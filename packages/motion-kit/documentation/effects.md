## Scene effects

Import the helpers you need and schedule them with `yield*`, `all`, or
`sequence`. Durations are in seconds. Each call finishes before the scene
continues.

| Helper                                    | Behavior                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| `pushIn(node, options?)`                  | Move and fade into the resting position.                        |
| `pushOut(node, options?)`                 | Move and fade out, then restore the position while hidden.      |
| `flashIn(node, options?)`                 | Flicker, then leave the node visible.                           |
| `flashOut(node, options?)`                | Flicker, then leave the node hidden.                            |
| `colorSwipe(node, options?)`              | Cover the bounds, swap visibility, and clear the cover.         |
| `rectTransform(source, target, options?)` | Cover the source, move the color block, then reveal the target. |
| `textTransform(source, target, options?)` | Morph text, typography, color, dimensions, and transform.       |

Push effects accept `offset`, `duration`, and `easing`. For layout nodes they
animate `translate`, so sibling positions stay fixed. Other nodes use
`position`. The resting position binding is restored after the effect.

Flash effects accept `duration`, `frequency` (flashes per second), `randomness`
(from 0 to 1), and `seed`. The same seed produces the same timing when replayed
or scrubbed. Their final opacity is 1 for entry and 0 for exit.

Wipes accept `colors`, `direction` (`horizontal` or `vertical`), `interval`,
`duration`, and `easing`. The duration includes both passes and the stagger. Use
`show` and `hide` to swap other nodes when the cover is complete. By default,
`show` is the target. To wipe a node out, pass it as `hide` and omit `show`:
`yield* colorSwipe(title(), {hide: title()})`. Text wipes fit the glyphs, and
layout-group wipes fit their content. Rectangle wipes follow the target's shape
and keep the stroke visible. The overlay is a sibling of the target; pass
`layer` to place it elsewhere, such as a dedicated effect layer above your
content.

Transforms accept `layer`, `duration`, and `easing`. The source and target keep
their layout slots. `rectTransform` fades a solid rectangle over the source,
hides the covered source, and moves and resizes the block to the target. It
reveals the target under the opaque block, then fades the block away. Its color
defaults to `defaultTheme.colors.accent`; pass `fill` to use a local theme
color. The block follows both nodes' world transforms and corner radii.

`textTransform` carries a text copy and interpolates its text, typography,
dimensions, color, and world transform. At completion the source is hidden and
the target is visible. Both transforms place their temporary node above the
source and target in their closest shared parent. An explicit `layer` overrides
that placement. When both labels occupy one line, the moving text stays on one
line throughout the transform instead of wrapping at an intermediate width.

Wipes and transforms remove their overlays in `finally`. Cancelling an effect
restores the original visibility bindings; cancelling a push also restores its
position. Completed entry and exit effects set opacity to 1 and 0 respectively.
Zero duration applies the final state immediately, with no overlay left behind.
Use separate calls for consecutive effects on the same properties.
