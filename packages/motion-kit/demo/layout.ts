import type {View2D} from '@canvas-commons/2d';
import {PresentationSize, type SlideProps} from '../registry/components/Slide';

/**
 * Fit the presentation canvas into the preview while preserving its proportions.
 * @example
 * ```tsx
 * <ContentSlide {...fitSlide(view)} title="Motion Effects" />
 * ```
 */
export function fitSlide(view: View2D): Pick<SlideProps, 'scale'> {
  return {
    scale: () =>
      Math.min(
        view.width() / PresentationSize.width,
        view.height() / PresentationSize.height,
      ),
  };
}
