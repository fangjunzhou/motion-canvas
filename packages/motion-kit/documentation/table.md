## Composition

Tables and rows are borderless by default. Header and highlighted-row fills
separate the content. Set native `lineWidth` and `stroke` explicitly when a
border is needed.

`Table` extends `Card`; direct `TableRow` children contain wrapping `TableCell`
text nodes. Rows and cells inherit the nearest table's reactive theme. Set the
same `grow` weights on corresponding cells in every row. Rich native text
children, text alignment, colors, native sizing, and refs remain available.

`TableCell` extends `Highlight`, so markers paint behind the complete wrapped
paragraph. Use `selection` for one phrase or `selections` for multiple colored
phrases, and animate `cell.reveal()` without changing the text color or layout.
Do not nest a Highlight inside a TableCell's rich-text children.

`TableRow` accepts `header` and `highlighted` signals. Headers use the mantle
surface and semibold labels; highlighted rows use a contrasting surface fill.
Padding, gaps, typography, and colors come from the table theme.

## Animation

`yield* table.enter(duration?, easing?)` fades the surface in and reveals rows
in order within the supplied duration. Construct it with `opacity: 0` when a
parent slide enters before the table, so rows do not flash before their reveal.
`yield* table.revealColumn(index, duration?, easing?)` reveals cells whose
opacity was set to zero while keeping their column slots. Indices are
zero-based; negative and noninteger indices throw. Missing trailing cells are
skipped.

Constructors start no threads. Repeated entrance calls reset the row reveal.
Zero duration applies the final state immediately; cancellation restores row
opacity bindings and the table's prior opacity. Column reveals leave cells
visible and do not change other columns.
