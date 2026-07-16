/**
 * Standard-score classification (mean 100, SD 15) — the descriptive bands a
 * school psychologist actually writes in a report. Drives the masthead pill and
 * each domain spread's plain-language readout. Tone maps to a theme token so the
 * band reads at a glance without leaning on color alone (the label carries it).
 */

export type BandTone = "high" | "mid" | "low" | "under";

export type Band = {
  label: string;
  tone: BandTone;
  /** CSS token for the accent — resolves in both themes and in export. */
  color: string;
};

const BANDS: { min: number; label: string; tone: BandTone }[] = [
  { min: 130, label: "Well above average", tone: "high" },
  { min: 120, label: "Above average", tone: "high" },
  { min: 110, label: "High average", tone: "high" },
  { min: 90, label: "Average", tone: "mid" },
  { min: 80, label: "Low average", tone: "low" },
  { min: 70, label: "Below average", tone: "low" },
  { min: 0, label: "Well below average", tone: "under" },
];

const TONE_COLOR: Record<BandTone, string> = {
  high: "var(--chart-2)", // moss — a strength
  mid: "var(--psych)", // role accent — typical range
  low: "var(--chart-3)", // ochre — watch
  under: "var(--chart-4)", // clay — well below
};

export function classify(score: number): Band {
  const b = BANDS.find((band) => score >= band.min) ?? BANDS[BANDS.length - 1];
  return { label: b.label, tone: b.tone, color: TONE_COLOR[b.tone] };
}

const firstWord = (name: string) => name.trim().split(/\s+/)[0] || name.trim();

/**
 * A short, factual reading of one domain — the band plus which subtest leads and
 * which trails. No diagnosis, no fabricated clinical judgment: just the numbers
 * said in plain words.
 */
export function categoryReadout(
  score: number,
  subtests: { name: string; score: number }[],
): string {
  const { label } = classify(score);
  const parts = [`${label} range.`];
  const measured = subtests.filter((s) => typeof s.score === "number");

  if (measured.length >= 2) {
    const sorted = [...measured].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const low = sorted[sorted.length - 1];
    if (Math.round(top.score) !== Math.round(low.score)) {
      parts.push(
        `${firstWord(top.name)} leads at ${Math.round(top.score)}; ${firstWord(
          low.name,
        )} trails at ${Math.round(low.score)}.`,
      );
    } else {
      parts.push(`Even across ${measured.length} subtests.`);
    }
  } else if (measured.length === 1) {
    parts.push(`One measure, at ${Math.round(measured[0].score)}.`);
  }

  return parts.join(" ");
}
