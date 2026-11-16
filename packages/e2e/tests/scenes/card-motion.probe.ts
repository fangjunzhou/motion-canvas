export interface CardMotionSample {
  width: number;
  height: number;
  title: string;
  titleOpacity: number;
  descriptionOpacity: number;
  contentOpacity: number;
  contentWidth: number;
  footerVisible: boolean;
  footerOpacity: number;
  footerText: string;
}

export interface CardImageSample {
  description: string;
  phase: string;
  height: number;
  width: number;
  contentWidth: number;
  contentOpacity: number;
  imageWidth: number;
  imageHeight: number;
  visible: boolean;
  opacity: number;
  src: string;
  loaded: boolean;
}

export interface CardMotionProbe {
  visibleTextInside: boolean;
  imageLayout: {
    resizing: boolean;
    positions: number[][];
    textPositions: number[][];
    textOpacity: number;
  }[];
  optionalParts: {
    full: number;
    withoutDescription: number;
    withoutContent: number;
    titleOnly: number;
    omitted: number;
    restored: number;
    clone: number;
  };
  badgeLayout: {
    text: string;
    width: number;
    footerY: number;
    stationary: boolean;
    automaticHeight: boolean;
    progress: number;
    curveX: number;
    curveInside: boolean;
  }[];
  styles: Record<
    string,
    {
      padding: number;
      gap: number;
      contentPadding: number;
      footerPadding: number;
      titleSize: number;
      bodySize: number;
      footerSize: number;
      badgeSize: number;
    }
  >;
  samples: CardMotionSample[];
  zeroDuration: CardMotionSample;
  repeatedFooterHeight: number;
  restoredHeightBinding: boolean;
  cancelled: CardMotionSample;
  independent: boolean;
  images: CardImageSample[];
  imageZeroDuration: CardImageSample;
  imageCancelled: CardImageSample;
  imageHeightRestored: boolean;
  imageIndependent: boolean;
}

declare global {
  interface Window {
    cardMotionProbe?: Promise<CardMotionProbe>;
  }
}
