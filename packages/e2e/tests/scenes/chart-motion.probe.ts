export interface ChartMotionProbe {
  labels: {text: string; alpha: number; progress: number}[];
  tips: {progress: number; x: number; y: number}[];
  timings: {
    phase: 'reveal' | 'erase' | 'linear';
    elapsed: number;
    progress: number;
    tip: number;
  }[];
  fullStroke: boolean;
  fullCap: boolean;
  clippedOutside: boolean;
  zeroProgress: boolean;
  zeroDuration: boolean;
  cancelled: boolean;
  nativeEnd: boolean;
  cloneIndependent: boolean;
}

declare global {
  interface Window {
    chartMotionProbe?: Promise<ChartMotionProbe>;
  }
}
