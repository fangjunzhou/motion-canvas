## Catppuccin flavors

The four defaults use the official
[Catppuccin palette](https://catppuccin.com/palette/): Latte, Frappé, Macchiato,
and Mocha. `defaultTheme` is Mocha.

Each flavor includes all 26 official colors, preserving the exact sRGB hex
values. Access named colors through `catppuccinPalettes.mocha.blue` or
`createTheme({flavor: 'mocha'}).colors.blue`. Numbered names use `surface0`,
`overlay1`, and `subtext0`. Both palette previews display all 26 colors in the
official order: accents, then text and neutral colors.

```ts
const theme = createTheme({flavor: 'mocha'});
const blue = theme.colors.blue; // #89b4fa
const crust = theme.colors.crust; // #11111b
```

The semantic roles below are aliases chosen for this toolkit; they are not
additional Catppuccin colors. Local `colors` overrides customize a theme without
changing the frozen official palettes.

```ts
const latte = createTheme({flavor: 'latte'});
const frappe = createTheme({flavor: 'frappe'});
const macchiato = createTheme({flavor: 'macchiato'});
const mocha = createTheme();

const customized = createTheme({flavor: 'latte', spacing: {medium: 40}});
const preset = catppuccinThemes.latte;
```

Flavor keys use `frappe` without the accent. Presets are deeply frozen and can
be used directly. `createTheme(overrides)` selects the requested flavor, merges
overrides within each group, and returns a new frozen theme. Existing calls
without a flavor use Mocha, including calls with only color or spacing
overrides.

| Semantic token | Catppuccin color |
| -------------- | ---------------- |
| `background`   | Base             |
| `surface`      | Surface 0        |
| `foreground`   | Text             |
| `muted`        | Subtext 0        |
| `accent`       | Lavender         |
| `border`       | Surface 2        |

## Tokens and overrides

The preview first grows and shrinks a wrapping description, then shows all four
flavors. The dot aligns with the first line using a fixed line height and a row
aligned to the top. Give the description an explicit wrapping width and tween
its `text` signal with a duration; its interpolated height then drives the
containing rectangle's automatic height.

```ts
yield * caption().text(nextCaption, theme.motion.long, theme.motion.emphasize);
```

| Group        | Tokens                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| `colors`     | `background`, `surface`, `foreground`, `muted`, `accent`, `border`                  |
| `typography` | `fontFamily`, `display`, `heading`, `subtitle`, `title`, `body`, `label`, `caption` |
| `padding`    | `small`, `medium`, `large`                                                          |
| `spacing`    | `small`, `medium`, `large`                                                          |
| `radius`     | `small`, `medium`                                                                   |
| `motion`     | `short`, `medium`, `long`, `enter`, `exit`, `emphasize`                             |

Typography roles default to 112 for presentation titles (`display`), 84 for
slide headings, 54 for centered subtitles and component titles, 48 for body
text, 32 for labels, and 30 for captions. The presentation sizes follow
Keynote’s bundled White widescreen template; the Slide documentation describes
the reference. Card titles, content, and footers use `title`, `body`, and
`caption`; Badge uses `label`.

Padding sets the inset inside a container. Spacing sets the gap between
elements. Both scales default to 16, 32, and 64 for `small`, `medium`, and
`large`. Changing a gap does not change card padding:

```ts
const theme = createTheme({
  padding: {medium: 40},
  spacing: {medium: 24},
  typography: {title: 36},
});
```

Padding, spacing, font sizes, and radii use canvas units. Motion durations use
seconds. The easing tokens are core `TimingFunction` values. The default font
uses the system's sans-serif face; load a specific font in a consuming project
when its renders need identical typography across machines.

## Props and signals

Themes are plain immutable values. Card, Badge, and Progress accept a reactive
`theme` prop. Replacing the theme updates their defaults without rebuilding the
nodes. Explicit native props override the corresponding defaults. Card parts
follow their nearest ancestor card's theme.

## Animation methods

This foundation defines timing defaults, with no component animation methods.
The preview uses existing `Rect` and `Txt` nodes to demonstrate those defaults.
