import {Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../registry/components/Card';
import {
  catppuccinPalettes,
  catppuccinThemes,
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
  const cards = Flavors.map(({flavor, label}) => ({
    label,
    theme: catppuccinThemes[flavor],
    palette: catppuccinPalettes[flavor],
  }));

  const stage = createRef<MotionKitStage>();

  view.fill(theme.colors.background);
  view.add(
    <MotionKitStage
      ref={stage}
      opacity={0}
      size={() => view.size()}
      heading="Catppuccin palettes"
      subtitle="All four themes use the same 26 color names."
    >
      <Layout
        grow={1}
        wrap="wrap"
        gap={theme.spacing.medium}
        alignContent="stretch"
      >
        {cards.map(({label, theme: preset, palette}) => (
          <Card theme={preset} grow={1} basis="40%" minWidth={0}>
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
            </CardContent>
            <CardFooter>
              <Txt
                text="14 accent colors and 12 neutral colors"
                fill={preset.colors.muted}
              />
            </CardFooter>
          </Card>
        ))}
      </Layout>
    </MotionKitStage>,
  );

  yield* stage().opacity(1, theme.motion.medium, theme.motion.enter);
  yield* waitFor(5);
  yield* stage().opacity(0, theme.motion.medium, theme.motion.exit);
});
