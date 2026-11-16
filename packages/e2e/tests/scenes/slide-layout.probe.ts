export interface SlideLayoutSample {
  width: number;
  height: number;
  padding: number;
  gap: number;
  title: string;
  titleSize: number;
  subtitleSize: number;
  headerHeight: number;
  headingHeight: number;
  headerY: number;
  headerInLayout: boolean;
  contentHeight: number;
  contentCount: number;
  frameCount: number;
}

export interface SlideLayoutProbe {
  layouts: Record<string, SlideLayoutSample>;
  exampleVariants: string[];
  fadeFrames: number;
}

declare global {
  interface Window {
    slideLayoutProbe?: Promise<SlideLayoutProbe>;
  }
}
