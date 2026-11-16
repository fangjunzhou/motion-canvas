export interface InkArrowProbe {
  samples: {progress: number; head: number}[];
  endpoints: boolean;
  clamped: boolean;
  independent: boolean;
  zeroLength: boolean;
  zeroDuration: boolean;
  cancelled: boolean;
}
declare global {
  interface Window {
    inkArrowProbe?: Promise<InkArrowProbe>;
  }
}
