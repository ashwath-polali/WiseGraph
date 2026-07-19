import { arc as d3arc } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { clampScore, SCOREMIN, SCOREMAX } from "@/lib/chartScaling";
import type { SubcategoryScore } from "@/types/scores";

export const SCORE_MIN = SCOREMIN;
export const SCORE_MAX = SCOREMAX;
export const RING_SCORES = [60, 75, 90, 105, 120, 135, 150];
export const MEAN = 100;
export const SD = 15;

/** A category as both charts consume it: class average + class subskill means. */
export type CategoryView = {
  id: string;
  name: string;
  abbrev: string;
  avgScore: number;
  classSubs: SubcategoryScore[];
};

/** Score → radial distance. 60 sits at the center, 150 at maxRadius. */
export function radiusForScore(score: number, maxRadius: number): number {
  return scaleLinear()
    .domain([SCORE_MIN, SCORE_MAX])
    .range([0, maxRadius])(clampScore(score));
}

export function polarPoint(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Equal wedges around the circle, starting at 12 o'clock. Math angles. */
export function categoryAngles(idx: number, count: number) {
  const per = (2 * Math.PI) / Math.max(count, 1);
  const start = idx * per - Math.PI / 2;
  const end = (idx + 1) * per - Math.PI / 2;
  return { start, end, mid: (start + end) / 2 };
}

const arcGen = d3arc<{
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  padAngle: number;
}>();

/**
 * Wedge path centered on (0,0) — translate via the parent <g>.
 * Takes math angles (0 = 3 o'clock) and converts to d3's clock convention.
 */
export function wedgePath(
  rOuter: number,
  mathStart: number,
  mathEnd: number,
  opts: { pad?: number; corner?: number } = {},
): string {
  const { pad = 0.012, corner = 2.5 } = opts;
  return (
    arcGen.cornerRadius(corner)({
      innerRadius: 0,
      outerRadius: Math.max(rOuter, 0.001),
      startAngle: mathStart + Math.PI / 2,
      endAngle: mathEnd + Math.PI / 2,
      padAngle: pad,
    }) ?? ""
  );
}

/**
 * Slot angles for a category's subskill band: trimmed to 80% of the wedge
 * span, centered on the wedge mid. Subskills pair positionally.
 */
export function bandAngles(start: number, end: number, count: number): number[] {
  const mid = (start + end) / 2;
  const halfSpan = ((end - start) * 0.8) / 2;
  const a0 = mid - halfSpan;
  const a1 = mid + halfSpan;
  return Array.from({ length: Math.max(count, 1) }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    return a0 + t * (a1 - a0);
  });
}

export type BandPoint = {
  id: string;
  name: string;
  score: number;
  x: number;
  y: number;
};

/**
 * Positions for the class + student subskill markers inside one wedge.
 * The baseline hugs the inner 40% of the wedge; peaks sit at true score radii.
 */
export function subskillBand(opts: {
  classSubs: SubcategoryScore[];
  studentSubs: SubcategoryScore[];
  start: number;
  end: number;
  maxRadius: number;
  cx: number;
  cy: number;
}): {
  classPts: BandPoint[];
  studentPts: BandPoint[];
  basePts: { x: number; y: number }[];
} {
  const { classSubs, studentSubs, start, end, maxRadius, cx, cy } = opts;
  if (!classSubs.length && !studentSubs.length) {
    return { classPts: [], studentPts: [], basePts: [] };
  }

  const count = Math.max(classSubs.length, studentSubs.length, 1);
  const angles = bandAngles(start, end, count);
  const baseR = maxRadius * 0.4 + 6;

  const classPts: BandPoint[] = [];
  const studentPts: BandPoint[] = [];
  const basePts: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const a = angles[i];

    const classSub = classSubs[i];
    if (classSub) {
      const p = polarPoint(cx, cy, radiusForScore(classSub.score, maxRadius), a);
      classPts.push({ id: classSub.id, name: classSub.name, score: classSub.score, ...p });
    }

    const studentSub = studentSubs[i];
    if (studentSub) {
      basePts.push(polarPoint(cx, cy, baseR, a));
      const p = polarPoint(cx, cy, radiusForScore(studentSub.score, maxRadius), a);
      studentPts.push({ id: studentSub.id, name: studentSub.name, score: studentSub.score, ...p });
    }
  }

  return { classPts, studentPts, basePts };
}

export function toPolyline(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Radial abbreviations: grow each name's prefix until unique, then add a
 * numeric suffix if two names share a full prefix.
 */
export function buildAbbreviations(names: string[]): string[] {
  const result: string[] = [];
  const used = new Set<string>();

  for (const full of names) {
    const clean = full.trim();
    if (!clean) {
      result.push("?");
      continue;
    }

    let len = 1;
    let abbr = clean.slice(0, len).toUpperCase();
    while (used.has(abbr) && len < clean.length) {
      len += 1;
      abbr = clean.slice(0, len).toUpperCase();
    }

    let final = abbr;
    let suffix = 2;
    while (used.has(final)) {
      final = abbr + suffix;
      suffix += 1;
    }

    used.add(final);
    result.push(final);
  }

  return result;
}

/**
 * Bell-curve abbreviations: one shared prefix length, extended until every
 * abbreviation is unique.
 */
export function buildLeadingLetterAbbrevs(names: string[]): string[] {
  const cleaned = names.map((n) => n.trim());
  const maxLen =
    Math.max(...cleaned.map((n) => (n.length === 0 ? 1 : n.length)), 1) || 1;

  let length = 1;
  let abbrevs: string[] = [];
  while (length <= maxLen) {
    abbrevs = cleaned.map((name) => {
      if (name.length === 0) return "?";
      return name.slice(0, length).toUpperCase();
    });

    if (new Set(abbrevs).size === abbrevs.length) break;
    length += 1;
  }

  return abbrevs;
}

export function normalPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

/** Deterministic vertical jitter in [-jitter, jitter], stable across renders. */
export function jitterForKey(key: string, jitter = 6): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const v = (hash % 1000) / 1000;
  return (v * 2 - 1) * jitter;
}
