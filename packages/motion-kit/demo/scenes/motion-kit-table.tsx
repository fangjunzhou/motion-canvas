import {Layout, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {ContentSlide} from '../../registry/components/Slide';
import {Table, TableCell, TableRow} from '../../registry/components/Table';
import {fitSlide} from '../layout';
import {demoTheme} from '../theme';

export default makeScene2D(function* (view) {
  const theme = demoTheme;
  const slide = createRef<ContentSlide>();
  const table = createRef<Table>();
  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={slide}
      theme={theme}
      {...fitSlide(view)}
      opacity={0}
      title="Tables"
      subtitle="Keep column slots fixed while rows and values reveal."
    >
      <Layout grow={1} justifyContent="center" direction="column">
        <Table ref={table} theme={theme} opacity={0}>
          <TableRow header>
            <TableCell text="Stage" grow={2} />
            <TableCell text="Status" opacity={0} />
          </TableRow>
          <TableRow>
            <TableCell text="Layout" grow={2} />
            <TableCell text="Ready" opacity={0} />
          </TableRow>
          <TableRow highlighted>
            <TableCell text="Animation" grow={2} />
            <TableCell text="Revealed" opacity={0} />
          </TableRow>
        </Table>
      </Layout>
    </ContentSlide>,
  );
  yield* slide().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* table().enter(theme.motion.long * 2);
  yield* waitFor(theme.motion.medium);
  yield* table().revealColumn(1);
  yield* waitFor(2);
  yield* slide().opacity(0, theme.motion.medium, theme.motion.exit);
});
