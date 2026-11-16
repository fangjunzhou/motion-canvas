import {describe, expect, it} from 'vitest';
import {
  catppuccinPalettes,
  catppuccinThemes,
  createTheme,
  defaultTheme,
  type MotionTheme,
  type ThemeFlavor,
} from '../registry/foundations/theme';

const Palettes = [
  {
    flavor: 'latte',
    colors: {
      background: '#eff1f5',
      surface: '#ccd0da',
      foreground: '#4c4f69',
      muted: '#6c6f85',
      accent: '#7287fd',
      border: '#acb0be',
    },
  },
  {
    flavor: 'frappe',
    colors: {
      background: '#303446',
      surface: '#414559',
      foreground: '#c6d0f5',
      muted: '#a5adce',
      accent: '#babbf1',
      border: '#626880',
    },
  },
  {
    flavor: 'macchiato',
    colors: {
      background: '#24273a',
      surface: '#363a4f',
      foreground: '#cad3f5',
      muted: '#a5adcb',
      accent: '#b7bdf8',
      border: '#5b6078',
    },
  },
  {
    flavor: 'mocha',
    colors: {
      background: '#1e1e2e',
      surface: '#313244',
      foreground: '#cdd6f4',
      muted: '#a6adc8',
      accent: '#b4befe',
      border: '#585b70',
    },
  },
] satisfies readonly {
  flavor: ThemeFlavor;
  colors: Partial<MotionTheme['colors']>;
}[];

const OfficialHex = {
  latte:
    'dc8a78 dd7878 ea76cb 8839ef d20f39 e64553 fe640b df8e1d 40a02b 179299 04a5e5 209fb5 1e66f5 7287fd 4c4f69 5c5f77 6c6f85 7c7f93 8c8fa1 9ca0b0 acb0be bcc0cc ccd0da eff1f5 e6e9ef dce0e8',
  frappe:
    'f2d5cf eebebe f4b8e4 ca9ee6 e78284 ea999c ef9f76 e5c890 a6d189 81c8be 99d1db 85c1dc 8caaee babbf1 c6d0f5 b5bfe2 a5adce 949cbb 838ba7 737994 626880 51576d 414559 303446 292c3c 232634',
  macchiato:
    'f4dbd6 f0c6c6 f5bde6 c6a0f6 ed8796 ee99a0 f5a97f eed49f a6da95 8bd5ca 91d7e3 7dc4e4 8aadf4 b7bdf8 cad3f5 b8c0e0 a5adcb 939ab7 8087a2 6e738d 5b6078 494d64 363a4f 24273a 1e2030 181926',
  mocha:
    'f5e0dc f2cdcd f5c2e7 cba6f7 f38ba8 eba0ac fab387 f9e2af a6e3a1 94e2d5 89dceb 74c7ec 89b4fa b4befe cdd6f4 bac2de a6adc8 9399b2 7f849c 6c7086 585b70 45475a 313244 1e1e2e 181825 11111b',
} satisfies Record<ThemeFlavor, string>;

describe('local themes', () => {
  it.each(Palettes)('preserves all 26 official $flavor colors', ({flavor}) => {
    const palette = catppuccinPalettes[flavor];
    expect(Object.keys(palette)).toEqual([
      'rosewater',
      'flamingo',
      'pink',
      'mauve',
      'red',
      'maroon',
      'peach',
      'yellow',
      'green',
      'teal',
      'sky',
      'sapphire',
      'blue',
      'lavender',
      'text',
      'subtext1',
      'subtext0',
      'overlay2',
      'overlay1',
      'overlay0',
      'surface2',
      'surface1',
      'surface0',
      'base',
      'mantle',
      'crust',
    ]);
    expect(Object.values(palette)).toEqual(
      OfficialHex[flavor].split(' ').map(hex => `#${hex}`),
    );
    expect(Object.isFrozen(palette)).toBe(true);
    expect(catppuccinThemes[flavor].colors).toMatchObject(palette);
    expect(createTheme({flavor}).colors).toMatchObject(palette);
  });
  it.each(Palettes)(
    'uses the official $flavor color scheme',
    ({flavor, colors}) => {
      const preset = catppuccinThemes[flavor];
      const theme = createTheme({flavor});
      expect(preset.colors).toMatchObject(colors);
      expect(theme.colors).toMatchObject(colors);
      expect(theme.colors).not.toBe(preset.colors);
      expect(Object.isFrozen(preset)).toBe(true);
      expect(Object.values(preset).every(group => Object.isFrozen(group))).toBe(
        true,
      );
      const customized = createTheme({flavor, colors: {accent: '#fab387'}});
      expect(customized.colors.accent).toBe('#fab387');
      expect(customized.colors.background).toBe(colors.background);
      expect(preset.colors).toMatchObject(colors);
    },
  );

  it('defaults existing factory calls to Mocha', () => {
    expect(defaultTheme).toBe(catppuccinThemes.mocha);
    expect(createTheme().colors).toEqual(catppuccinThemes.mocha.colors);
    expect(Object.isFrozen(catppuccinThemes)).toBe(true);
  });

  it('merges nested overrides without sharing mutable groups or changing defaults', () => {
    const first = createTheme({
      colors: {accent: '#f97316'},
      spacing: {medium: 40},
      padding: {small: 12},
      typography: {title: 36, caption: 18},
    });
    const second = createTheme({colors: {accent: '#a78bfa'}});
    expect(first.colors.accent).toBe('#f97316');
    expect(first.colors.surface).toBe(defaultTheme.colors.surface);
    expect(first.spacing.medium).toBe(40);
    expect(first.spacing.small).toBe(defaultTheme.spacing.small);
    expect(first.padding.small).toBe(12);
    expect(first.padding.medium).toBe(defaultTheme.padding.medium);
    expect(first.typography.title).toBe(36);
    expect(first.typography.caption).toBe(18);
    expect(first.typography.body).toBe(defaultTheme.typography.body);
    expect(second.colors.accent).toBe('#a78bfa');
    expect(defaultTheme.colors.accent).toBe('#b4befe');
    expect(first.colors).not.toBe(second.colors);
    expect(first.typography).not.toBe(defaultTheme.typography);
    expect(first.padding).not.toBe(defaultTheme.padding);
    expect(second.padding).toEqual(defaultTheme.padding);
    for (const theme of [first, second, defaultTheme]) {
      expect(Object.isFrozen(theme)).toBe(true);
      expect(Object.values(theme).every(group => Object.isFrozen(group))).toBe(
        true,
      );
    }
  });

  it('keeps padding independent from layout gaps across all flavors', () => {
    for (const {flavor} of Palettes) {
      const padded = createTheme({flavor, padding: {medium: 48}});
      const spaced = createTheme({flavor, spacing: {medium: 24}});
      expect(padded.spacing).toEqual(defaultTheme.spacing);
      expect(spaced.padding).toEqual(defaultTheme.padding);
      expect(catppuccinThemes[flavor].typography).toEqual(
        defaultTheme.typography,
      );
      expect(catppuccinThemes[flavor].padding.medium).toBe(32);
    }
  });
});
