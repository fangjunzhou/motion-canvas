## Usage

Progress is a native `Rect` inspired by
[shadcn/ui Progress](https://ui.shadcn.com/docs/components/base/progress). Its
reactive `value` defaults to zero, with `min={0}` and `max={100}`. For an
animation signal that runs from zero to one, bind
`value={() => progress() * 100}`.

The indicator clamps to the range. `fraction()` returns its bounded value from
zero to one. Non-finite values and invalid bounds produce an empty track.

Use `fill` for the track and `indicatorFill` for the indicator. Both accept
native canvas styles. `theme` supplies the default background and accent colors.
Native dimensions, transforms, radius, and layout props remain available. The
track defaults to 16 scene units high with rounded ends. `textDirection="rtl"`
fills from the right.

Place a native `Txt` label and value display above the track in a `Layout`, as
in the example. Native children render above the indicator, so a marker can
follow the completion fraction. There are no private scene nodes to duplicate
when cloning. Instances own their signals; reactive bindings stay live on
clones.

Animate `value` with core signal generators, or bind it to another signal. The
component starts no threads and adds no implicit easing. Reset, replay, and
seeking follow the calling scene. This component displays determinate progress;
indeterminate loading is not part of its API.
