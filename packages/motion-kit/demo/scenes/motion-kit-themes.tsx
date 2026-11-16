import {Layout, Rect, makeScene2D} from '@canvas-commons/2d';
import {
  createRef,
  createRefArray,
  sequence,
  waitFor,
} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../registry/components/Card';
import {ContentSlide} from '../../registry/components/Slide';
import {
  catppuccinPalettes,
  catppuccinThemes,
  defaultTheme,
  type ThemeFlavor,
} from '../../registry/foundations/theme';

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
  const theme = defaultTheme;
  const cards = Flavors.map(({flavor, label}) => ({
    label,
    theme: catppuccinThemes[flavor],
    palette: catppuccinPalettes[flavor],
    ref: createRef<Card>(),
    swatches: createRefArray<Rect>(),
  }));

  const stage = createRef<ContentSlide>();

  view.fill(theme.colors.background);
  view.add(
    <ContentSlide
      ref={stage}
      opacity={0}
      size={() => view.size()}
      title="Catppuccin Palettes"
      subtitle="Each palette has 14 accent colors and 12 neutral colors."
    >
      <Layout
        grow={1}
        wrap="wrap"
        gap={theme.spacing.medium}
        alignContent="stretch"
      >
        {cards.map(({label, theme: preset, palette, ref, swatches}) => (
          <Card
            ref={ref}
            theme={preset}
            grow={1}
            basis="40%"
            minWidth={0}
            opacity={0}
          >
            <CardHeader>
              <CardTitle text={label} />
              <CardDescription text={`Background ${palette.base}`} />
            </CardHeader>
            <CardContent
              grow={1}
              justifyContent="center"
              gap={preset.spacing.small}
            >
              {[
                Object.values(palette).slice(0, 14),
                Object.values(palette).slice(14),
              ].map(colors => (
                <Layout gap={preset.spacing.small / 2}>
                  {colors.map(fill => (
                    <Rect
                      ref={swatches}
                      opacity={0}
                      grow={1}
                      basis={0}
                      ratio={2}
                      radius={preset.radius.small / 2}
                      fill={fill}
                      stroke={preset.colors.border}
                      lineWidth={2}
                    />
                  ))}
                </Layout>
              ))}
            </CardContent>
          </Card>
        ))}
      </Layout>
    </ContentSlide>,
  );

  yield* stage().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* sequence(
    theme.motion.long,
    ...cards.map(function* ({ref, swatches}) {
      yield* ref().enter();
      for (const swatch of swatches) {
        yield* swatch.opacity(1, theme.motion.short / 2, theme.motion.enter);
      }
    }),
  );
  yield* waitFor(theme.motion.long);
  yield* stage().opacity(0, theme.motion.medium, theme.motion.exit);
});
