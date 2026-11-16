## Document coordinates

`RegionHighlight` draws a marker over an image, page, or diagram. Place it
inside the frame it annotates. `area` contains `x`, `y`, `width`, and `height`
in the source document's coordinates, measured from the top left.
`coordinateSize` defines that source frame and defaults to `[1000, 1000]`.

The region scales with its direct parent when that parent is a native `Layout`,
`Rect`, or `Img`. With a plain `Node` parent, it uses `coordinateSize` as the
frame dimensions. The marker does not participate in layout.

```tsx
<Rect size={[800, 600]}>
  <Img src={page} size="100%" />
  <RegionHighlight
    ref={marker}
    coordinateSize={[1600, 1200]}
    area={{x: 200, y: 300, width: 900, height: 80}}
  />
</Rect>
```

Match the parent frame to the displayed document bounds. For a letterboxed or
cropped image, position a separate frame over the actual image content before
adding the marker.

## Appearance and animation

`color` defaults to the theme's yellow; native `opacity` defaults to 0.35.
Native `compositeOperation` can set a blend mode such as `darken`. `theme`
supplies the color and motion defaults.

`progress` controls the horizontal reveal from 0 to 1.
`reveal(duration?, easing?)` starts at 0 and draws the full region.
`erase(duration?, easing?)` retracts from the current progress. Repeating either
method is supported; zero duration sets the endpoint immediately. Cancellation
holds the current progress. `bounds()` returns the full mapped region regardless
of progress. Invalid coordinate sizes produce an empty region.

Use the existing `Highlight` component for a marker that follows text wrapping.
