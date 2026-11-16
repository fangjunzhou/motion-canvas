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

## Paper preview

The example annotates page 1 of _Attention Is All You Need_ by Vaswani et al.
(2017), using the page's original 612 by 792 point coordinates. It marks the
title, then the abstract, and keeps the region aligned while the page zooms. The
page is embedded locally as a lossless WebP, so no external image request is
needed. The source is the [version 7 paper](https://arxiv.org/pdf/1706.03762v7);
the page retains its original copyright and reuse terms.
