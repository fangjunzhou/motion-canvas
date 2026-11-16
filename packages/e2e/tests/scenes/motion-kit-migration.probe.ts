export interface MigrationProbe {
  pushStable: boolean;
  pushBinding: boolean;
  flashOut: boolean;
  flashRuns: number[][];
  wipeMapped: boolean;
  wipeClean: boolean;
  cancelClean: boolean;
  morphFinal: boolean;
  textFinal: boolean;
  regionMapped: boolean;
  regionResponsive: boolean;
  stackWindow: boolean;
  stackBackward: boolean;
  stackClone: boolean;
  stackShadow: boolean;
  stackShadowOverride: boolean;
  chartMapped: boolean;
  chartReactive: boolean;
  chartTicks: boolean;
  chartInvalid: boolean;
  chartClone: boolean;
  zeroLine: boolean;
  clippedLine: boolean;
  cardWipe: boolean;
  cardSwipeOrder: number[];
  slideStaged: boolean;
  slideWiped: boolean;
  slideReplay: boolean;
  slideCancelled: boolean;
  slideOrder: number[];
  slideEnterOrder: number[];
  slideSwipeIn: boolean;
  slideEnterCancelled: boolean;
  blankSlideExit: boolean;
}
declare global {
  interface Window {
    migrationProbe?: Promise<MigrationProbe>;
  }
}
