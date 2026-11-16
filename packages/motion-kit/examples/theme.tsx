import {Circle, Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitFor} from '@canvas-commons/core';
import {
  catppuccinPalettes,
  catppuccinThemes,
  defaultTheme,
  type ThemeFlavor,
} from '../registry/foundations/theme';

const Flavors = [
  {flavor: 'latte', label: 'Latte'},
  {flavor: 'frappe', label: 'Frappé'},
  {flavor: 'macchiato', label: 'Macchiato'},
  {flavor: 'mocha', label: 'Mocha'},
] satisfies readonly {flavor: ThemeFlavor; label: string}[];

export default makeScene2D(function* (view) {
  const theme = defaultTheme;
  const panel = createRef<Rect>();
  const caption = createRef<Txt>();
  const panelWidth = 720;
  const captionLineHeight = theme.typography.body * 1.25;
  const captionWidth =
    panelWidth - theme.padding.large * 2 - theme.spacing.small * 2;
  const shortCaption = 'Shared tokens. Local customization.';
  const cards = Flavors.map(({flavor, label}) => ({
    label,
    palette: catppuccinPalettes[flavor],
    theme: catppuccinThemes[flavor],
    ref: createRef<Rect>(),
  }));

  view.fill(defaultTheme.colors.background);
  view.add(
    <Rect
      ref={panel}
      layout
      direction="column"
      width={panelWidth}
      padding={theme.padding.large}
      gap={theme.spacing.medium}
      radius={theme.radius.medium}
      fill={theme.colors.surface}
      stroke={theme.colors.border}
      lineWidth={4}
      fontFamily={theme.typography.fontFamily}
    >
      <Txt
        width="100%"
        textWrap
        text="Your Animation, Your Source"
        fontSize={theme.typography.heading}
        fill={theme.colors.foreground}
      />
      <Layout gap={theme.spacing.small} alignItems="start">
        <Circle
          size={theme.spacing.small}
          shrink={0}
          marginTop={(captionLineHeight - theme.spacing.small) / 2}
          fill={theme.colors.accent}
        />
        <Txt
          ref={caption}
          width={captionWidth}
          shrink={0}
          textWrap
          text={shortCaption}
          fontSize={theme.typography.body}
          lineHeight={captionLineHeight}
          fill={theme.colors.muted}
        />
      </Layout>
    </Rect>,
  );
  view.add(
    <Layout layout direction="column" gap={theme.spacing.medium}>
      {[cards.slice(0, 2), cards.slice(2)].map(row => (
        <Layout layout gap={theme.spacing.medium}>
          {row.map(({label, theme, palette, ref}) => (
            <Rect
              ref={ref}
              layout
              direction="column"
              width={720}
              height={360}
              padding={theme.padding.medium}
              gap={theme.spacing.small}
              radius={theme.radius.medium}
              fill={theme.colors.surface}
              stroke={theme.colors.border}
              lineWidth={4}
              opacity={0}
              fontFamily={theme.typography.fontFamily}
            >
              <Layout alignItems="center" justifyContent="space-between">
                <Txt
                  text={label}
                  fontSize={theme.typography.title}
                  fill={theme.colors.foreground}
                />
                <Rect
                  width={48}
                  height={6}
                  radius={theme.radius.small}
                  fill={theme.colors.accent}
                />
              </Layout>
              <Txt
                text="Your animation, your source."
                fontSize={theme.typography.body}
                fill={theme.colors.foreground}
              />
              <Layout direction="column" gap={theme.spacing.small / 2}>
                {[
                  Object.values(palette).slice(0, 14),
                  Object.values(palette).slice(14),
                ].map(colors => (
                  <Layout gap={theme.spacing.small / 4}>
                    {colors.map(fill => (
                      <Rect
                        grow={1}
                        basis={0}
                        ratio={2}
                        radius={theme.radius.small / 4}
                        fill={fill}
                      />
                    ))}
                  </Layout>
                ))}
              </Layout>
            </Rect>
          ))}
        </Layout>
      ))}
    </Layout>,
  );

  yield* waitFor(theme.motion.medium);
  yield* caption().text(
    'Shared tokens. Local customization, even when your description needs another line.',
    theme.motion.long,
    theme.motion.emphasize,
  );
  yield* waitFor(theme.motion.long);
  yield* caption().text(
    shortCaption,
    theme.motion.long,
    theme.motion.emphasize,
  );
  yield* waitFor(theme.motion.medium);
  yield* panel().opacity(0, theme.motion.medium, theme.motion.exit);
  panel().remove();

  yield* all(
    ...cards.map(({ref, theme}) =>
      ref().opacity(1, theme.motion.medium, theme.motion.enter),
    ),
  );
  yield* waitFor(defaultTheme.motion.medium);
  yield* all(
    ...cards.map(({ref, theme}) =>
      ref().stroke(
        theme.colors.accent,
        theme.motion.medium,
        theme.motion.emphasize,
      ),
    ),
  );
  yield* waitFor(2);
});
