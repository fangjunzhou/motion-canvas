export interface HighlightProbe {
  samples: {
    style: 'straight' | 'hand-drawn';
    progress: number;
    width: number;
    height: number;
    boxes: {x: number; y: number; width: number; height: number}[];
  }[];
  missing: number;
  empty: number;
  allLines: number;
  independent: boolean;
  erased: number;
  revealed: number;
}
declare global {
  interface Window {
    highlightProbe?: Promise<HighlightProbe>;
  }
}
