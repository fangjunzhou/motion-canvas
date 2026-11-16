import {Layout, Txt, type LayoutProps} from '@canvas-commons/2d';
import type {SignalValue} from '@canvas-commons/core';
import {createTheme} from '../../registry/foundations/theme';

/** Shared typography and spacing for the demo scenes. */
export const ShowcaseTheme = createTheme({typography: {body: 24}});

export interface MotionKitStageProps extends LayoutProps {
  heading: SignalValue<string>;
  subtitle: SignalValue<string>;
}

/**
 * Scene headings stay in place while content fills the remaining space.
 *
 * @example
 * ```tsx
 * <MotionKitStage
 *   size={() => view.size()}
 *   heading="Four palettes. One toolkit."
 *   subtitle="Shared semantic tokens for every scene."
 * >
 *   <Rect grow={1} />
 * </MotionKitStage>
 * ```
 */
export class MotionKitStage extends Layout {
  public constructor({
    heading,
    subtitle,
    children,
    ...props
  }: MotionKitStageProps) {
    const theme = ShowcaseTheme;
    super({
      layout: true,
      direction: 'column',
      padding: theme.spacing.large,
      gap: theme.spacing.medium,
      fontFamily: theme.typography.fontFamily,
      ...props,
      children: [
        <Layout direction="column" gap={theme.spacing.small} shrink={0}>
          <Txt
            width="100%"
            textWrap
            text={heading}
            fontSize={theme.typography.heading}
            fontWeight={700}
            fill={theme.colors.foreground}
          />
          <Txt
            width="100%"
            textWrap
            text={subtitle}
            fontSize={theme.typography.body}
            fill={theme.colors.muted}
          />
        </Layout>,
        <Layout direction="column" grow={1} basis={0} minHeight={0}>
          {children}
        </Layout>,
      ],
    });
  }
}
