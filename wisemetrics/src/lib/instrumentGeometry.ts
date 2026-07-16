/**
 * One source of truth for the landing-page morph bridge + class constellation.
 * Re-exports the REAL geometry from each instrument so a morphed dot lands
 * exactly where the instrument draws it. Never use charts/class/geometry.ts here
 * (that is a different, unused-by-the-instruments scale).
 *
 * Both instruments share the score ratio (clamp(s) - 60) / 90; only their
 * viewBoxes differ (polar 600×600, bell 1000×520). The bridge remaps both into
 * one overlay coordinate space using these constants.
 */

export {
  SIZE as POLAR_SIZE,
  C as POLAR_C,
  MAXR as POLAR_MAXR,
  INNER as POLAR_INNER,
  scoreToRadius as polarScoreToRadius,
  catAngles as polarCatAngles,
  polarPointAt,
  colorOf as domainColor,
} from "@/components/charts/student/StudentPolarInstrument";

export {
  W as BELL_W,
  H as BELL_H,
  PAD_L as BELL_PAD_L,
  PLOT_W as BELL_PLOT_W,
  BASE_Y as BELL_BASE_Y,
  mapX as bellMapX,
  curveY as bellCurveY,
} from "@/components/charts/student/StudentBellInstrument";
