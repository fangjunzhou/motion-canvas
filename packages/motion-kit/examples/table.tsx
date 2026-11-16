import {makeScene2D} from '@canvas-commons/2d';
import {Color, all, createRef, waitFor} from '@canvas-commons/core';
import {Table, TableCell, TableRow} from '../registry/components/Table';
import {defaultTheme} from '../registry/foundations/theme';
export default makeScene2D(function* (view) {
  view.fill(defaultTheme.colors.background);
  const ready = createRef<TableCell>();
  const revealed = createRef<TableCell>();
  const table = new Table({
    theme: defaultTheme,
    opacity: 0,
    width: 1400,
    children: (
      <>
        <TableRow header>
          <TableCell text="Stage" grow={2} />
          <TableCell text="Status" opacity={0} />
        </TableRow>
        <TableRow>
          <TableCell text="Layout" grow={2} />
          <TableCell
            ref={ready}
            text="Ready"
            opacity={0}
            selections={[
              {
                text: 'Ready',
                color: new Color(defaultTheme.colors.green).alpha(0.3),
              },
            ]}
          />
        </TableRow>
        <TableRow highlighted>
          <TableCell text="Animation" grow={2} />
          <TableCell
            ref={revealed}
            text="Revealed"
            opacity={0}
            selections={[
              {
                text: 'Revealed',
                color: new Color(defaultTheme.colors.yellow).alpha(0.3),
              },
            ]}
          />
        </TableRow>
      </>
    ),
  });
  view.add(table);
  yield* table.enter();
  yield* waitFor(0.5);
  yield* table.revealColumn(1);
  yield* all(ready().reveal(), revealed().reveal());
  yield* waitFor(2);
});
