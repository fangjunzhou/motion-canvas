export interface EffectsMotionProbe {
  stableSlots: boolean;
  colorBlock: boolean;
  coveredSource: boolean;
  coveredTarget: boolean;
  sharedLayer: boolean;
  titleChanged: boolean;
  glyphWidth: number;
  allocatedWidth: number;
  border: number[];
  cornerAlpha: number;
  cancelled: boolean;
  inheritedFont: boolean;
  rectCancelled: boolean;
  rectImmediate: boolean;
  fillOverride: boolean;
}
declare global {
  interface Window {
    effectsMotionProbe?: Promise<EffectsMotionProbe>;
  }
}
