import {Layout, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {Badge, type BadgeVariant} from '../registry/components/Badge';
import {defaultTheme} from '../registry/foundations/theme';

const Variants: BadgeVariant[] = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'ghost',
  'link',
];

export default makeScene2D(function* (view) {
  const status = createRef<Badge>();
  view.fill(defaultTheme.colors.background);
  view.add(
    <Layout
      layout
      direction="column"
      gap={defaultTheme.spacing.medium}
      alignItems="center"
    >
      <Layout gap={defaultTheme.spacing.small}>
        {Variants.map(variant => (
          <Badge text={variant} variant={variant} />
        ))}
      </Layout>
      <Badge ref={status} text="Rendering" variant="secondary" opacity={0} />
    </Layout>,
  );
  yield* status().enter();
  yield* waitFor(1);
  yield* status().changeText({text: 'Complete', variant: 'default'}, 0.6);
  yield* status().emphasize();
  yield* waitFor(2);
  yield* status().exit();
});
