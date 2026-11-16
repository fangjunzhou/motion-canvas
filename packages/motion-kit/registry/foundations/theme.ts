import {
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  type TimingFunction,
} from '@canvas-commons/core';

/** Official Catppuccin color names, with numbered names written in camelCase. */
export type CatppuccinColor =
  | 'rosewater'
  | 'flamingo'
  | 'pink'
  | 'mauve'
  | 'red'
  | 'maroon'
  | 'peach'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'sky'
  | 'sapphire'
  | 'blue'
  | 'lavender'
  | 'text'
  | 'subtext1'
  | 'subtext0'
  | 'overlay2'
  | 'overlay1'
  | 'overlay0'
  | 'surface2'
  | 'surface1'
  | 'surface0'
  | 'base'
  | 'mantle'
  | 'crust';

/** All 26 exact sRGB hex colors in one Catppuccin flavor. */
export type CatppuccinPalette = Readonly<Record<CatppuccinColor, string>>;

/** Shared defaults for scene components. Durations are measured in seconds. */
export interface MotionTheme {
  readonly colors: Readonly<
    CatppuccinPalette & {
      background: string;
      surface: string;
      foreground: string;
      muted: string;
      accent: string;
      border: string;
    }
  >;
  readonly typography: Readonly<{
    fontFamily: string;
    body: number;
    heading: number;
  }>;
  readonly spacing: Readonly<{
    small: number;
    medium: number;
    large: number;
  }>;
  readonly radius: Readonly<{
    small: number;
    medium: number;
  }>;
  readonly motion: Readonly<{
    short: number;
    medium: number;
    long: number;
    enter: TimingFunction;
    exit: TimingFunction;
    emphasize: TimingFunction;
  }>;
}

/** The four Catppuccin color schemes. */
export type ThemeFlavor = 'latte' | 'frappe' | 'macchiato' | 'mocha';

/** A Catppuccin flavor and per-group overrides for a scene's theme. */
export type ThemeOverrides = {
  readonly [TGroup in keyof MotionTheme]?: Partial<MotionTheme[TGroup]>;
} & {readonly flavor?: ThemeFlavor};

const SharedTokens = Object.freeze({
  typography: Object.freeze({fontFamily: 'sans-serif', body: 32, heading: 48}),
  spacing: Object.freeze({small: 16, medium: 32, large: 64}),
  radius: Object.freeze({small: 12, medium: 24}),
  motion: Object.freeze({
    short: 0.2,
    medium: 0.4,
    long: 0.8,
    enter: easeOutCubic,
    exit: easeInCubic,
    emphasize: easeInOutCubic,
  }),
});

/**
 * Complete official palettes, preserving every name and hex value.
 *
 * @see https://catppuccin.com/palette/
 * @example
 * ```ts
 * const blue = catppuccinPalettes.mocha.blue;
 * ```
 */
export const catppuccinPalettes: Readonly<
  Record<ThemeFlavor, CatppuccinPalette>
> = Object.freeze({
  latte: Object.freeze({
    rosewater: '#dc8a78',
    flamingo: '#dd7878',
    pink: '#ea76cb',
    mauve: '#8839ef',
    red: '#d20f39',
    maroon: '#e64553',
    peach: '#fe640b',
    yellow: '#df8e1d',
    green: '#40a02b',
    teal: '#179299',
    sky: '#04a5e5',
    sapphire: '#209fb5',
    blue: '#1e66f5',
    lavender: '#7287fd',
    text: '#4c4f69',
    subtext1: '#5c5f77',
    subtext0: '#6c6f85',
    overlay2: '#7c7f93',
    overlay1: '#8c8fa1',
    overlay0: '#9ca0b0',
    surface2: '#acb0be',
    surface1: '#bcc0cc',
    surface0: '#ccd0da',
    base: '#eff1f5',
    mantle: '#e6e9ef',
    crust: '#dce0e8',
  }),
  frappe: Object.freeze({
    rosewater: '#f2d5cf',
    flamingo: '#eebebe',
    pink: '#f4b8e4',
    mauve: '#ca9ee6',
    red: '#e78284',
    maroon: '#ea999c',
    peach: '#ef9f76',
    yellow: '#e5c890',
    green: '#a6d189',
    teal: '#81c8be',
    sky: '#99d1db',
    sapphire: '#85c1dc',
    blue: '#8caaee',
    lavender: '#babbf1',
    text: '#c6d0f5',
    subtext1: '#b5bfe2',
    subtext0: '#a5adce',
    overlay2: '#949cbb',
    overlay1: '#838ba7',
    overlay0: '#737994',
    surface2: '#626880',
    surface1: '#51576d',
    surface0: '#414559',
    base: '#303446',
    mantle: '#292c3c',
    crust: '#232634',
  }),
  macchiato: Object.freeze({
    rosewater: '#f4dbd6',
    flamingo: '#f0c6c6',
    pink: '#f5bde6',
    mauve: '#c6a0f6',
    red: '#ed8796',
    maroon: '#ee99a0',
    peach: '#f5a97f',
    yellow: '#eed49f',
    green: '#a6da95',
    teal: '#8bd5ca',
    sky: '#91d7e3',
    sapphire: '#7dc4e4',
    blue: '#8aadf4',
    lavender: '#b7bdf8',
    text: '#cad3f5',
    subtext1: '#b8c0e0',
    subtext0: '#a5adcb',
    overlay2: '#939ab7',
    overlay1: '#8087a2',
    overlay0: '#6e738d',
    surface2: '#5b6078',
    surface1: '#494d64',
    surface0: '#363a4f',
    base: '#24273a',
    mantle: '#1e2030',
    crust: '#181926',
  }),
  mocha: Object.freeze({
    rosewater: '#f5e0dc',
    flamingo: '#f2cdcd',
    pink: '#f5c2e7',
    mauve: '#cba6f7',
    red: '#f38ba8',
    maroon: '#eba0ac',
    peach: '#fab387',
    yellow: '#f9e2af',
    green: '#a6e3a1',
    teal: '#94e2d5',
    sky: '#89dceb',
    sapphire: '#74c7ec',
    blue: '#89b4fa',
    lavender: '#b4befe',
    text: '#cdd6f4',
    subtext1: '#bac2de',
    subtext0: '#a6adc8',
    overlay2: '#9399b2',
    overlay1: '#7f849c',
    overlay0: '#6c7086',
    surface2: '#585b70',
    surface1: '#45475a',
    surface0: '#313244',
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
  }),
});

function createPreset(palette: CatppuccinPalette): MotionTheme {
  return Object.freeze({
    ...SharedTokens,
    colors: Object.freeze({
      ...palette,
      background: palette.base,
      surface: palette.surface0,
      foreground: palette.text,
      muted: palette.subtext0,
      accent: palette.lavender,
      border: palette.surface2,
    }),
  });
}

/**
 * Themes containing the complete palettes and semantic aliases.
 *
 * @example
 * ```tsx
 * <Rect fill={catppuccinThemes.latte.colors.blue} />
 * ```
 */
export const catppuccinThemes: Readonly<Record<ThemeFlavor, MotionTheme>> =
  Object.freeze({
    latte: createPreset(catppuccinPalettes.latte),
    frappe: createPreset(catppuccinPalettes.frappe),
    macchiato: createPreset(catppuccinPalettes.macchiato),
    mocha: createPreset(catppuccinPalettes.mocha),
  });

/**
 * Catppuccin Mocha defaults, including shared typography and motion tokens.
 *
 * @example
 * ```tsx
 * <Rect fill={defaultTheme.colors.surface} radius={defaultTheme.radius.medium} />
 * ```
 */
export const defaultTheme: MotionTheme = catppuccinThemes.mocha;

/**
 * Create an independent, immutable theme from a Catppuccin flavor and overrides.
 *
 * @example
 * ```ts
 * const theme = createTheme({flavor: 'latte', spacing: {medium: 40}});
 * ```
 */
export function createTheme(overrides: ThemeOverrides = {}): MotionTheme {
  const base = catppuccinThemes[overrides.flavor ?? 'mocha'];
  return Object.freeze({
    colors: Object.freeze({...base.colors, ...overrides.colors}),
    typography: Object.freeze({
      ...base.typography,
      ...overrides.typography,
    }),
    spacing: Object.freeze({...base.spacing, ...overrides.spacing}),
    radius: Object.freeze({...base.radius, ...overrides.radius}),
    motion: Object.freeze({...base.motion, ...overrides.motion}),
  });
}
