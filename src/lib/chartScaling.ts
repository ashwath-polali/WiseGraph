export const SCOREMIN = 60;
export const SCOREMAX = 150;

export type ScoreBand = "below-average" | "average" | "above-average" | "exceptional";

export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 100;
  if (score < SCOREMIN) return SCOREMIN;
  if (score > SCOREMAX) return SCOREMAX;
  return score;
}

export function classifyScore(score: number): ScoreBand {
  const s = clampScore(score);
  if (s < 85) return "below-average";
  if (s <= 115) return "average";
  if (s <= 130) return "above-average";
  return "exceptional";
}
