## Props and signals

This item contains TypeScript types only. It creates no nodes, signals, or
timers. Import the types with `import type` in the component source that uses
them.

## Animation methods

`MotionMethod` accepts an optional duration in seconds and an optional core
`TimingFunction`, and returns a `ThreadGenerator`.

`MotionMethods` describes three optional capabilities:

| Method                          | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `enter(duration?, easing?)`     | Introduce a component from its documented initial state. |
| `exit(duration?, easing?)`      | Remove visual emphasis or hide a component.              |
| `emphasize(duration?, easing?)` | Temporarily draw attention to a component.               |

Implement the capabilities that fit the component. Document its starting and
ending states, zero-duration behavior, repeat behavior, and which signals the
method changes. Do not automatically run animations during construction. Let the
scene combine and schedule the returned generators.
