## Composition

`List` extends native `Layout` and accepts a reactive `theme`. Its `ListItem`
children accept a `text` signal or native children for rich labels. Markers are
circles aligned with the first text line, so wrapping never moves the marker to
the center of the paragraph. Native flex props and refs remain available.
`clone()` copies the marker and label or custom children once, with theme
defaults inherited from the copy's own list. `snapshotClone()` freezes current
text, geometry, and opacity for transitions; its public `label` still identifies
the copied plain-text label.

## Animation

`yield* list.enter(duration?, easing?)` staggers the shared `pushIn` effect over
the direct children. Resting layout positions and sibling spacing stay fixed.
Constructors start no threads; cancellation follows the shared push effect's
position and visibility restoration. Repeating the entrance replays it, and zero
duration applies the visible final state.
