## Composition

`Flow` extends native `Layout` and composes direct `Card` children, including
`VideoCard` subclasses, with arrow connectors. The theme controls gaps,
connector labels, colors, and timing. `connections` accepts optional
`{label, detail?}` entries; their text values may be reactive signals. Use
matching `grow` weights and zero basis on cards to divide the available row
width. Cards stretch to a shared row height while connector labels stay
vertically centered. Override native `alignItems` when the composition needs
another rule.

## Animation

`yield* flow.enter(duration?, easing?)` resets the reveal, introduces each card
with its Kit entrance, and reveals its incoming label and arrow first. When a
parent slide enters before the flow, construct the flow with `opacity: 0` so its
stages do not appear before their own entrance. Cancellation restores the
previous flow, stage, connector, and arrow bindings.
`yield* flow.emphasize(index, duration?)` accents and gently scales one stage,
restoring its resting scale and stroke bindings. Invalid emphasis indices throw.

The scene schedules every method. Constructors start no threads. Repeating
entrance replays the sequence and zero duration reveals it immediately. Native
props, card refs, the public `stages` array, public connector slots, and public
`arrows` remain available for composition.

The stage sequence is established at construction. Animate its cards and label
signals in place; construct another Flow when the sequence itself changes.

## Diagram edges

`FlowArrow` is a clean native `Line` with the semantic accent stroke and
arrowhead. Pass native `points`, including reactive points or orthogonal routes,
and animate its `end` from the initial zero to one. Native `radius`, `opacity`,
stroke, and arrow props remain available.

```ts
const feedback = new FlowArrow({
  theme,
  points: [
    [400, 100],
    [400, 180],
    [-200, 180],
    [-200, 100],
  ],
});
view.add(feedback);
yield * feedback.end(1, 0.5);
```
