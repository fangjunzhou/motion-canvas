import {Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, sequence, waitFor} from '@canvas-commons/core';
import {
  catppuccinPalettes,
  createTheme,
  type ThemeFlavor,
} from '../../registry/foundations/theme';
import {MotionKitStage, ShowcaseTheme} from '../components/MotionKitStage';

const Flavors = [
  {flavor: 'latte', label: 'Latte'},
  {flavor: 'frappe', label: 'Frappé'},
  {flavor: 'macchiato', label: 'Macchiato'},
  {flavor: 'mocha', label: 'Mocha'},
] satisfies readonly {
  flavor: ThemeFlavor;
  label: string;
}[];

export default makeScene2D(function* (view) {
  const theme = ShowcaseTheme;
  const stage = createRef<MotionKitStage>();
  const cards = Flavors.map(flavor => ({
    ...flavor,
    theme: createTheme({flavor: flavor.flavor, typography: theme.typography}),
    palette: catppuccinPalettes[flavor.flavor],
    ref: createRef<Rect>(),
  }));

  view.fill(theme.colors.background);
  view.add(
    <MotionKitStage
      ref={stage}
      opacity={0}
      size={() => view.size()}
      heading="Built-in Motion Kit themes"
      subtitle="Catppuccin color palettes"
    >
      <Layout
        grow={1}
        wrap="wrap"
        gap={theme.spacing.medium}
        alignContent="stretch"
      >
        {cards.map(({label, theme: preset, palette, ref}) => (
          <Rect
            ref={ref}
            layout
            direction="column"
            grow={1}
            basis="40%"
            minWidth={0}
            justifyContent="space-between"
            padding={preset.spacing.medium}
            gap={preset.spacing.small}
            radius={preset.radius.medium}
            fill={preset.colors.background}
            stroke={preset.colors.border}
            lineWidth={3}
          >
            <Txt
              text={label}
              fontSize={preset.typography.heading}
              fontWeight={600}
              fill={preset.colors.foreground}
            />
            <Layout direction="column" gap={preset.spacing.small}>
              {[
                Object.values(palette).slice(0, 14),
                Object.values(palette).slice(14),
              ].map(colors => (
                <Layout gap={preset.spacing.small / 2}>
                  {colors.map(fill => (
                    <Rect
                      grow={1}
                      basis={0}
                      ratio={2}
                      radius={preset.radius.small / 2}
                      fill={fill}
                      stroke={preset.colors.border}
                      lineWidth={1}
                    />
                  ))}
                </Layout>
              ))}
            </Layout>
          </Rect>
        ))}
      </Layout>
    </MotionKitStage>,
  );

  yield* stage().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* waitFor(1);
  yield* sequence(
    0.3,
    ...cards.map(function* ({ref, theme: preset}) {
      yield* ref().stroke(
        preset.colors.accent,
        preset.motion.medium,
        preset.motion.emphasize,
      );
      yield* waitFor(0.8);
      yield* ref().stroke(
        preset.colors.border,
        preset.motion.medium,
        preset.motion.emphasize,
      );
    }),
  );
  yield* waitFor(4);
  yield* stage().opacity(0, theme.motion.medium, theme.motion.exit);
});
