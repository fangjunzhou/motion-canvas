import {Color} from '@canvas-commons/core';
import {createTheme} from '../registry/foundations/theme';

const BaseTheme = createTheme({flavor: 'mocha'});

/**
 * Shared showcase styling, including a translucent marker for light text.
 * @example
 * ```tsx
 * <ContentSlide theme={demoTheme} title="Shared Theme" />
 * ```
 */
export const demoTheme = Object.freeze({
  ...BaseTheme,
  colors: Object.freeze({
    ...BaseTheme.colors,
    highlight: new Color(BaseTheme.colors.yellow).alpha(0.2).toString(),
  }),
});
