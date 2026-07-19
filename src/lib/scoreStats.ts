/**
 * Standard-score statistics (mean 100, SD 15) shared by the polar and bell
 * instruments and their detail panels. Kept in one place so the numbers a
 * parent reads are identical across every view.
 */

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** Cumulative normal probability at a standard score, 0–1. */
export function normalCdf(score: number) {
  return 0.5 * (1 + erf((score - 100) / 15 / Math.SQRT2));
}

export function percentileOf(score: number) {
  return Math.min(99, Math.max(1, Math.round(normalCdf(score) * 100)));
}

export function classificationOf(score: number) {
  if (score >= 130) return "Very superior";
  if (score >= 120) return "Superior";
  if (score >= 110) return "High average";
  if (score >= 90) return "Average";
  if (score >= 80) return "Low average";
  if (score >= 70) return "Borderline";
  return "Extremely low";
}

export function sdText(score: number) {
  const z = (score - 100) / 15;
  return `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(1)} SD`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
