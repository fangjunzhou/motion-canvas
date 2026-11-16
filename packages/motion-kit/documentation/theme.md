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

| Group        | Tokens                                                             |
| ------------ | ------------------------------------------------------------------ |
| `colors`     | `background`, `surface`, `foreground`, `muted`, `accent`, `border` |
| `typography` | `fontFamily`, `body`, `heading`                                    |
| `spacing`    | `small`, `medium`, `large`                                         |
| `radius`     | `small`, `medium`                                                  |
| `motion`     | `short`, `medium`, `long`, `enter`, `exit`, `emphasize`            |

Spacing, font sizes, and radii use canvas units. Motion durations use seconds.
The easing tokens are core `TimingFunction` values. The default font uses the
system's sans-serif face; load a specific font in a consuming project when its
renders need identical typography across machines.

## Props and signals

Themes are plain immutable values. A future component can accept a theme as
constructor configuration, then expose signals for the individual properties
callers need to animate. Its child nodes should read those signals through
callbacks instead of capturing their construction-time values.

## Animation methods

This foundation defines timing defaults, with no component animation methods.
The preview uses existing `Rect` and `Txt` nodes to demonstrate those defaults.
