## Plot parts

`Chart` is a native `Rect` with data coordinates. Add `ChartAxis` and
`ChartLine` children to compose a plot. Theme colors and typography follow the
parent chart. Native fill, stroke, radius, dimensions, and transforms remain
available.

| Part        | Props                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `Chart`     | `xRange`, `yRange`, `origin`, `theme`                                                                    |
| `ChartAxis` | `orientation`, `label`, `ticks`, `tickCount`, `tickLength`, `fontSize`, `lineWidth`, `color`, `progress` |
| `ChartLine` | `data`, `progress`, plus native `Line` props such as `stroke`, `lineWidth`, `start`, and `end`           |

Ranges default to `[0, 1]`; the origin defaults to `[0, 0]`. `point(x, y)` maps
a data coordinate into the chart's local space, with positive y pointing upward.
Changing ranges or dimensions updates the axes and lines reactively. Padding
does not change this mapping. Leave room outside the frame for axis labels.
`valid()` checks that both ranges are finite and increasing. Invalid ranges hide
the plot and return the local center from `point()`.

Axes clamp the origin to the frame. They generate five equal intervals by
default. Supply `ticks={[{value: 0, label: 'Start'}, {value: 2, label: 'End'}]}`
for explicit labels, or `ticks={[]}` to omit ticks. Out-of-range and non-finite
ticks are filtered out. `tickValues()` returns the current visible-range ticks.

`data` is an array of `[x, y]` pairs. Direct `ChartLine` children are clipped to
the plot frame with a half-stroke allowance. This keeps lines and round caps
visible at the boundaries while clipping data beyond them. Axis labels remain
outside that clip. Native `points` can override the mapped data when needed;
data points must use finite coordinates.

## Drawing animation

Set axis `progress={0}` and call `reveal(duration?, easing?)` to draw each axis.
The shaft draws first. Tick marks and their text fade in as the shaft reaches
them; the axis title and arrowhead fade in before the animation finishes. The
method restarts from 0; cancellation holds the current progress. Animate
`progress` directly to erase or resume it.

For the data line, set `progress={0}` and call `reveal(duration?, easing?)`:

```ts
yield * all(xAxis().reveal(), yAxis().reveal());
yield * series().reveal(2);
```

Line progress follows the horizontal axis. At 50%, the line ends halfway across
the plot, regardless of the distance traveled along the curve. Supply points in
ascending x order for this reveal. It samples the native path, preserving
rounded corners and the cap at the moving endpoint. `reveal` uses the chart
theme's `motion.enter` easing; `erase` retracts from the current progress using
`motion.exit`. Pass a different easing as the second argument to either method.
For a time axis that advances at a constant rate, use `reveal(2, linear)` with
`linear` imported from `@canvas-commons/core`. Easing changes the drawing speed
without changing the plotted data. Cancellation holds the current progress, and
zero duration applies the endpoint immediately.

Native `start`, `end`, and offset signals remain available for animation by path
length. An explicit `end` overrides the horizontal reveal; reset that signal to
use `progress` again. A zero-length reveal draws nothing, including the round
cap. Ranges, data, line styling, and the chart theme remain reactive.
