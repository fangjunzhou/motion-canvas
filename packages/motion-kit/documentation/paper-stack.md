## Composition

`PaperStack` extends native `Layout` and arranges public `PaperStackItem`
children in offset slots. Each item extends the existing `Card`, so the same
headers, content, footers, and images work inside a page. Items inherit the
stack theme unless given their own, and default to absolute placement within the
stack. Use native `grow`, `basis`, width, and height props to place the stack in
a flex layout, then bind page dimensions to the available stack size.

The first child is the front page. `offset` defaults to `[24, 24]` per page;
native item `position` adds another offset. `focusIndex` is zero-based and
defaults to 0. `visibleCount` defaults to 3. Set it to 0 for an entrance.

Each page casts a soft shadow onto the pages below it. This comes from the
item's native `shadowColor`, `shadowBlur`, and `shadowOffset` props: the
defaults are the theme's crust color at 32% opacity, a blur of 16, and an offset
of `[0, 8]`. Override them on a `PaperStackItem` to change the shadow. Set
`shadowBlur={0}` and `shadowOffset={0}` to remove it.

## Animation

`show(count, duration?, easing?)` staggers page fades into the current focus
window. `focus(index, duration?, easing?)` slides that window forward or
backward while fading pages at its edges. Both methods clamp their input to the
available pages and use the stack's theme for timing. They keep page nodes in
place, so refs and reactive bindings remain usable. Page images finish loading
before either animation starts.

Zero duration applies the final state immediately. Cancellation restores the
previous focus and count along with each item's opacity binding. Clones own
their child cards and derive their slots from their new parent.

## Images and masks

Use the existing `CardImage` for image pages:

```tsx
<PaperStack visibleCount={3}>
  <PaperStackItem width={612} height={792} padding={0}>
    <CardImage src={firstPage} height="100%" fit="contain" />
  </PaperStackItem>
  <PaperStackItem width={612} height={792} padding={0}>
    <CardImage src={secondPage} height="100%" fit="contain" />
  </PaperStackItem>
</PaperStack>
```

Match the item's aspect ratio to the source page and use `padding={0}` to show
the full sheet. The demo uses local images of the first three pages of
[Attention Is All You Need](https://arxiv.org/abs/1706.03762). Its highlight
uses PDF page coordinates, so it stays aligned when the page scales or moves.
The demo places the stack inside a clipped `Layout`, then animates its native
`scale` and `translate` to center and enlarge the highlighted region. It zooms
back out before focusing another page.

Native clipping also covers the old `MaskedImg` use case without another
component. Set an explicit frame size to keep it fixed while scaling the image:

```tsx
<Rect size={[600, 400]} radius={24} clip>
  <Img src={image} width={800} />
</Rect>
```

For a frame that follows the image, bind `size` to an image ref's `size()`.
Native cached nodes and `compositeOperation="source-in"` support custom masks.
