"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import type { ClassScoreSummary } from "@/types/scores";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

/* ------------------------------------------------------------------ *
 * WiseGraph — the polar instrument.
 * Wiseman's radial, rebuilt as a large luminous SVG: thin arc strokes
 * with a light-falling-inward wash, a signature dashed overall ring, and
 * the 5-point subtest polyline. Pure SVG so it prints and exports.
 * This module (step 1) is the static visual + hover; drill/select,
 * self-draw and cursor parallax layer on top in later passes.
 * ------------------------------------------------------------------ */

const SIZE = 600;
const C = SIZE / 2;
const MAXR = 236;
const INNER = 6;
const RINGS = [60, 70, 85, 100, 115, 130, 150];

// [chart-1, 2, 3, 5, 6] cycle — matches the established wedge order.
const COLOR_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-5", "--chart-6"];
const colorOf = (i: number) => `var(${COLOR_TOKENS[i % COLOR_TOKENS.length]})`;

const clamp = (s: number) => Math.max(60, Math.min(150, s));
const scoreToRadius = (s: number) => INNER + ((clamp(s) - 60) / 90) * MAXR;
const n2 = (v: number) => Math.round(v * 100) / 100;

/** angle for a category slot — 12 o'clock start, clockwise. */
function catAngles(idx: number, count: number) {
  const per = (2 * Math.PI) / Math.max(count, 1);
  const start = idx * per - Math.PI / 2;
  const end = (idx + 1) * per - Math.PI / 2;
  return { start, end, mid: (start + end) / 2 };
}
const P = (r: number, a: number) => ({ x: C + r * Math.cos(a), y: C + r * Math.sin(a) });

/** closed pie slice (wash fill), from center to radius r across [start,end]. */
function wedgeFill(r: number, start: number, end: number, pad = 0.02) {
  const a0 = start + pad;
  const a1 = end - pad;
  const p0 = P(r, a0);
  const p1 = P(r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${C} ${C} L ${n2(p0.x)} ${n2(p0.y)} A ${n2(r)} ${n2(r)} 0 ${large} 1 ${n2(p1.x)} ${n2(p1.y)} Z`;
}
/** open outer arc (strokeable, has a real length for draw-on). */
function arcPath(r: number, start: number, end: number, pad = 0.02) {
  const a0 = start + pad;
  const a1 = end - pad;
  const p0 = P(r, a0);
  const p1 = P(r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${n2(p0.x)} ${n2(p0.y)} A ${n2(r)} ${n2(r)} 0 ${large} 1 ${n2(p1.x)} ${n2(p1.y)}`;
}
/** subtest slot angles — trimmed to the inner 78% of the wedge. */
function subAngles(start: number, end: number, count: number) {
  const mid = (start + end) / 2;
  const half = ((end - start) * 0.78) / 2;
  const a0 = mid - half;
  const a1 = mid + half;
  return Array.from({ length: Math.max(count, 1) }, (_, i) =>
    count <= 1 ? mid : a0 + (i / (count - 1)) * (a1 - a0),
  );
}

type Sub = { id: string; name: string; score: number };
type Cat = { id: string; name: string; score: number; subs: Sub[] };

type SelectedItem = {
  type: "category" | "subcategory" | "overall";
  name: string;
  score: number;
  categoryName?: string;
  snapshotScore?: number;
};

// standard-score readouts (mean 100, SD 15) for the detail panel
function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
function percentileOf(score: number) {
  const p = 0.5 * (1 + erf((score - 100) / 15 / Math.SQRT2));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}
function classificationOf(score: number) {
  if (score >= 130) return "Very superior";
  if (score >= 120) return "Superior";
  if (score >= 110) return "High average";
  if (score >= 90) return "Average";
  if (score >= 80) return "Low average";
  if (score >= 70) return "Borderline";
  return "Extremely low";
}
function sdText(score: number) {
  const z = (score - 100) / 15;
  return `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(1)} SD`;
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

type SnapshotData = {
  scores: {
    categoryId: string;
    subcategoryId: string | null;
    standardScore: number;
  }[];
};

type Props = {
  evaluation: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
  showFullNames?: boolean;
  onToggleNames?: () => void;
  onExpand?: () => void;
  comparisonSnapshotId?: string | null;
  /** externally drive the highlighted domain (scroll-driven tour). null = none. */
  focusIndex?: number | null;
  /** hide the chart's own control buttons (when the page supplies its own). */
  hideControls?: boolean;
};

export function StudentPolarInstrument({
  evaluation,
  svgRef,
  showFullNames = false,
  onToggleNames,
  onExpand,
  comparisonSnapshotId,
  focusIndex,
  hideControls = false,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [overallHover, setOverallHover] = useState(false);
  const [ready, setReady] = useState(false);
  const [drill, setDrill] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [scrollDrill, setScrollDrill] = useState(false); // drill was opened by the scroll tour, not a click
  const [subHover, setSubHover] = useState<string | null>(null); // hovered subtest id in the drill view

  const cats: Cat[] = useMemo(
    () =>
      evaluation.categories.map((c) => ({
        id: c.id,
        name: c.name,
        score: c.score,
        subs: (c.subcategories ?? []).map((s) => ({ id: s.id, name: s.name, score: s.score })),
      })),
    [evaluation],
  );
  const count = Math.max(cats.length, 1);
  const overall =
    evaluation.students[0]?.overallScore ??
    Math.round(cats.reduce((a, c) => a + c.score, 0) / count);

  // snapshot ("before") overlay
  useEffect(() => {
    if (!comparisonSnapshotId) {
      setSnapshot(null);
      return;
    }
    let live = true;
    fetch(`/api/snapshots/${comparisonSnapshotId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setSnapshot(d ?? null))
      .catch(() => live && setSnapshot(null));
    return () => {
      live = false;
    };
  }, [comparisonSnapshotId]);

  // categories can be reconfigured under us — never keep a drill/selection that
  // points at a category that no longer exists.
  useEffect(() => {
    setDrill(null);
    setSelected(null);
  }, [evaluation]);

  // the scroll tour OPENS each domain — it drills into the focused category so
  // its subtests fan out, and returns to the full radial for the overview scenes.
  useEffect(() => {
    if (focusIndex === undefined) return;
    if (focusIndex == null || !cats[focusIndex]) {
      setScrollDrill(false);
      setDrill(null);
      setSelected(null);
      setHover(null);
    } else {
      setScrollDrill(true);
      setDrill(cats[focusIndex].id);
      setSelected(null); // the scene text carries the readout; no floating panel
      setHover(focusIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIndex]);

  // Escape closes the detail panel (and exits drill if open)
  useEffect(() => {
    if (!selected && !drill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else if (drill) setDrill(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, drill]);

  const snapCat = (id: string) =>
    snapshot?.scores.find((s) => s.categoryId === id && s.subcategoryId === null)?.standardScore ??
    null;
  const snapSub = (cid: string, sid: string) =>
    snapshot?.scores.find((s) => s.categoryId === cid && s.subcategoryId === sid)?.standardScore ??
    null;

  const overallR = scoreToRadius(overall);

  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const rotX = useRef<((v: number) => void) | null>(null);
  const rotY = useRef<((v: number) => void) | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setReduceMotion(true);
        setReady(true);
        return; // no parallax, no entrance — everything renders at its resting state
      }

      // cursor parallax (mouse enhancement only)
      rotY.current = gsap.quickTo(tilt.current, "rotationY", { duration: 0.5, ease: "power3.out" });
      rotX.current = gsap.quickTo(tilt.current, "rotationX", { duration: 0.5, ease: "power3.out" });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          gsap.set(q(".inst-arc, .inst-subline, .inst-overallglow"), {
            clearProps: "strokeDasharray,strokeDashoffset",
          });
          setReady(true);
        },
      });
      tlRef.current = tl;
      tl.from(q(".inst-ring"), { opacity: 0, duration: 0.4, stagger: 0.03 })
        .from(q(".inst-ringlabel"), { opacity: 0, duration: 0.3 }, "<")
        .from(q(".inst-overallglow"), { drawSVG: 0, duration: 0.7, ease: "power1.inOut" }, "-=0.1")
        .from(q(".inst-overall"), { opacity: 0, duration: 0.5 }, "<0.25")
        .from(q(".inst-wash"), { opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.4")
        .from(q(".inst-arc"), { drawSVG: 0, duration: 0.55, stagger: 0.12, ease: "power2.out" }, "<")
        .from(q(".inst-subline"), { drawSVG: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.45")
        .from(
          q(".inst-dot"),
          { scale: 0, transformOrigin: "50% 50%", duration: 0.4, stagger: 0.03, ease: "back.out(1.7)" },
          "-=0.4",
        )
        .from(q(".inst-catlabel"), { opacity: 0, duration: 0.4, stagger: 0.04 }, "-=0.5")
        .from(q(".inst-snap"), { opacity: 0, duration: 0.5 }, "-=0.3")
        .from(
          q(".inst-hub"),
          { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "back.out(1.5)" },
          "-=0.6",
        );
    },
    { scope: root },
  );

  // when a domain opens (drill changes), fan its subtests in fluidly
  useGSAP(
    () => {
      if (!drill || reduceMotion) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(q(".drill-arc"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.55, ease: "power2.out" });
      gsap.fromTo(q(".drill-poly"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.6, delay: 0.15, ease: "power2.out" });
      gsap.from(q(".drill-sub"), {
        opacity: 0,
        scale: 0.3,
        transformOrigin: "50% 50%",
        duration: 0.45,
        stagger: 0.07,
        ease: "back.out(1.8)",
      });
    },
    { dependencies: [drill], scope: root },
  );

  const onMove = (e: React.MouseEvent) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotY.current?.(px * 7);
    rotX.current?.(-py * 7);
  };
  const onLeave = () => {
    setHover(null);
    rotY.current?.(0);
    rotX.current?.(0);
  };
  const skip = () => {
    const tl = tlRef.current;
    if (!tl || tl.progress() >= 1) return;
    tl.progress(1); // jump to end-state; this does NOT fire onComplete
    gsap.set(gsap.utils.selector(root)(".inst-arc, .inst-subline, .inst-overallglow"), {
      clearProps: "strokeDasharray,strokeDashoffset",
    });
    setReady(true); // otherwise subtest labels stay hidden after a skip
  };

  // kill the entrance timeline if we unmount mid-flight
  useEffect(
    () => () => {
      tlRef.current?.kill();
    },
    [],
  );

  const drillIdx = drill ? cats.findIndex((c) => c.id === drill) : -1;
  const drillCat = drillIdx >= 0 ? cats[drillIdx] : null;
  const openDrill = (i: number) => {
    const c = cats[i];
    setScrollDrill(false);
    setDrill(c.id);
    setSelected({ type: "category", name: c.name, score: c.score, snapshotScore: snapCat(c.id) ?? undefined });
  };
  const selectCat = (c: Cat) =>
    setSelected({ type: "category", name: c.name, score: c.score, snapshotScore: snapCat(c.id) ?? undefined });
  const selectSub = (cat: Cat, s: Sub) =>
    setSelected({
      type: "subcategory",
      name: s.name,
      score: s.score,
      categoryName: cat.name,
      snapshotScore: snapSub(cat.id, s.id) ?? undefined,
    });
  const exitDrill = () => {
    setDrill(null);
    setSelected(null);
    setScrollDrill(false);
  };

  return (
    <div ref={root} className="relative flex h-full w-full flex-col" onMouseMove={onMove}>
      <div
        className="relative min-h-0 flex-1"
        style={{ perspective: "1400px" }}
        onMouseLeave={onLeave}
        onPointerDown={skip}
      >
        <div ref={tilt} className="h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-full w-full overflow-visible"
        >
          <defs>
            {cats.map((cat, i) => (
              <radialGradient
                key={i}
                id={`inst-wash-${i}`}
                gradientUnits="userSpaceOnUse"
                cx={C}
                cy={C}
                r={Math.max(scoreToRadius(cat.score), 1)}
              >
                <stop offset="0%" stopColor={colorOf(i)} stopOpacity={0} />
                <stop offset="45%" stopColor={colorOf(i)} stopOpacity={0.06} />
                <stop offset="88%" stopColor={colorOf(i)} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colorOf(i)} stopOpacity={0.34} />
              </radialGradient>
            ))}
            <radialGradient id="inst-hub" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={46}>
              <stop offset="0%" stopColor="var(--psych)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--psych)" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* --- reference grid --- */}
          <g>
            {/* average range 85–115 as a faint annulus */}
            <circle cx={C} cy={C} r={n2(scoreToRadius(115))} fill="var(--muted)" opacity={0.16} />
            <circle cx={C} cy={C} r={n2(scoreToRadius(85))} fill="var(--background)" />
            {RINGS.map((s) => (
              <circle
                key={s}
                className="inst-ring"
                cx={C}
                cy={C}
                r={n2(Math.max(scoreToRadius(s), 0.5))}
                fill="none"
                stroke="var(--border)"
                strokeWidth={s === 100 ? 1.1 : 0.7}
                strokeDasharray={s === 100 ? "none" : "2 7"}
                opacity={s === 100 ? 0.9 : 0.65}
              />
            ))}
            {RINGS.filter((s) => s > 60).map((s) => {
              const p = P(scoreToRadius(s), -Math.PI / 2);
              return (
                <text
                  key={`rl-${s}`}
                  x={p.x + 5}
                  y={n2(p.y) - 2}
                  className="inst-ringlabel font-mono"
                  fontSize={9}
                  fill="var(--muted-foreground)"
                  stroke="var(--background)"
                  strokeWidth={3}
                  paintOrder="stroke"
                  opacity={0.75}
                >
                  {s}
                </text>
              );
            })}
          </g>

          {/* --- overall ring (signature) with concentric fake-glow — always on --- */}
          <g onMouseEnter={() => setOverallHover(true)} onMouseLeave={() => setOverallHover(false)}>
            <circle
              className="inst-overallglow"
              cx={C}
              cy={C}
              r={n2(overallR)}
              fill="none"
              stroke={overallHover ? "var(--chart-3)" : "var(--foreground)"}
              strokeWidth={6}
              opacity={0.08}
            />
            <circle
              className="inst-overall"
              cx={C}
              cy={C}
              r={n2(overallR)}
              fill="none"
              stroke={overallHover ? "var(--chart-3)" : "var(--foreground)"}
              strokeWidth={2}
              strokeDasharray="6 6"
              opacity={overallHover ? 0.9 : 0.55}
              style={{ transition: "stroke .2s, opacity .2s" }}
            />
          </g>

          {/* ===== FULL VIEW (all categories) ===== */}
          <g style={{ opacity: drill ? 0 : 1, pointerEvents: drill ? "none" : "auto", transition: "opacity .4s ease" }}>
          {/* --- category wedges (wash + arc line) --- */}
          {cats.map((cat, i) => {
            const { start, end, mid } = catAngles(i, count);
            const r = scoreToRadius(cat.score);
            const dot = P(r, mid);
            const on = hover === i;
            return (
              <g
                key={cat.id}
                data-export="show"
                className="cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onClick={() => openDrill(i)}
                style={{ transition: "opacity .2s", opacity: hover == null || on ? 1 : 0.55 }}
              >
                <title>
                  {cat.name}: standard score {Math.round(cat.score)}. Click to open.
                </title>
                <path className="inst-wash" d={wedgeFill(r, start, end)} fill={`url(#inst-wash-${i})`} />
                <path
                  className="inst-arc"
                  d={arcPath(r, start, end)}
                  fill="none"
                  stroke={colorOf(i)}
                  strokeWidth={on ? 3 : 1.75}
                  strokeLinecap="round"
                  style={{ transition: "stroke-width .18s" }}
                />
                {/* category score dot — opens the detail panel without drilling */}
                <circle
                  className="inst-dot"
                  cx={n2(dot.x)}
                  cy={n2(dot.y)}
                  r={on ? 5.5 : 4.5}
                  fill={colorOf(i)}
                  stroke="var(--card)"
                  strokeWidth={1.75}
                  style={{ transition: "r .15s" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCat(cat);
                  }}
                />
              </g>
            );
          })}

          {/* --- snapshot ("before") ghost, dashed chart-5 --- */}
          {snapshot &&
            cats.map((cat, i) => {
              const { start, end } = catAngles(i, count);
              const sc = snapCat(cat.id) ?? cat.score;
              const r = scoreToRadius(sc);
              const angs = subAngles(start, end, Math.max(cat.subs.length, 1));
              const pad = (end - start) * 0.11;
              const pStart = P(r, start + pad);
              const pEnd = P(r, end - pad);
              const pts = [
                pStart,
                ...cat.subs.map((s, j) => P(scoreToRadius(snapSub(cat.id, s.id) ?? s.score), angs[j])),
                pEnd,
              ];
              return (
                <polyline
                  key={`snap-${cat.id}`}
                  className="inst-snap"
                  points={pts.map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ")}
                  fill="none"
                  stroke="var(--chart-5)"
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              );
            })}

          {/* --- subtest polylines + nodes + labels --- */}
          {cats.map((cat, i) => {
            const { start, end } = catAngles(i, count);
            const r = scoreToRadius(cat.score);
            const angs = subAngles(start, end, Math.max(cat.subs.length, 1));
            const pad = (end - start) * 0.11;
            const pStart = P(r, start + pad);
            const pEnd = P(r, end - pad);
            const subPts = cat.subs.map((s, j) => ({ ...P(scoreToRadius(s.score), angs[j]), s, a: angs[j] }));
            const pts = [pStart, ...subPts, pEnd];
            const on = hover === i;
            const showLabels = on || hover == null;
            return (
              <g key={`sub-${cat.id}`} style={{ pointerEvents: "none" }}>
                <polyline
                  className="inst-subline"
                  points={pts.map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ")}
                  fill="none"
                  stroke={colorOf(i)}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
                {subPts.map((p) => {
                  const lp = P(scoreToRadius(p.s.score) + 16, p.a);
                  return (
                    <g key={p.s.id}>
                      <circle className="inst-dot" cx={n2(p.x)} cy={n2(p.y)} r={2.8} fill={colorOf(i)} fillOpacity={0.9} stroke="var(--card)" strokeWidth={1} />
                      <text
                        x={n2(lp.x)}
                        y={n2(lp.y)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={showFullNames ? 8 : 9.5}
                        fontWeight={500}
                        fill="var(--muted-foreground)"
                        stroke="var(--background)"
                        strokeWidth={1.8}
                        paintOrder="stroke"
                        opacity={ready && showLabels ? 0.85 : 0}
                        style={{ transition: "opacity .2s" }}
                      >
                        {showFullNames ? p.s.name : p.s.name.charAt(0).toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* --- category labels --- */}
          {cats.map((cat, i) => {
            const { mid } = catAngles(i, count);
            const p = P(MAXR + 42, mid);
            const hangs = Math.sin(mid) > 0.05;
            const on = hover === i;
            return (
              <text
                key={`lbl-${cat.id}`}
                x={n2(p.x)}
                y={n2(p.y)}
                textAnchor="middle"
                dominantBaseline={hangs ? "hanging" : "auto"}
                className="inst-catlabel font-sans"
                fontSize={13}
                fontWeight={on ? 700 : 600}
                fill="var(--foreground)"
                opacity={on ? 1 : 0.72}
                letterSpacing="0.01em"
                style={{ transition: "opacity .2s" }}
              >
                {cat.name}
              </text>
            );
          })}
          </g>

          {/* ===== DRILL VIEW (one category, focused) ===== */}
          {drillCat &&
            (() => {
              const i = drillIdx;
              const color = colorOf(i);
              const span = (160 * Math.PI) / 180;
              const start = -Math.PI / 2 - span / 2;
              const end = -Math.PI / 2 + span / 2;
              const r = scoreToRadius(drillCat.score);
              const angs = subAngles(start, end, Math.max(drillCat.subs.length, 1));
              const pad = (end - start) * 0.06;
              const pStart = P(r, start + pad);
              const pEnd = P(r, end - pad);
              const subPts = drillCat.subs.map((s, j) => ({ ...P(scoreToRadius(s.score), angs[j]), s, a: angs[j] }));
              const pts = [pStart, ...subPts, pEnd];
              const snapPts = snapshot
                ? (() => {
                    const sr = scoreToRadius(snapCat(drillCat.id) ?? drillCat.score);
                    const ps = P(sr, start + pad);
                    const pe = P(sr, end - pad);
                    return [
                      ps,
                      ...drillCat.subs.map((s, j) => P(scoreToRadius(snapSub(drillCat.id, s.id) ?? s.score), angs[j])),
                      pe,
                    ];
                  })()
                : null;
              return (
                <g style={{ opacity: drill ? 1 : 0, transition: "opacity .4s ease" }}>
                  <path d={wedgeFill(r, start, end)} fill={`url(#inst-wash-${i})`} />
                  <path className="drill-arc" d={arcPath(r, start, end)} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
                  {snapPts && (
                    <polyline
                      points={snapPts.map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ")}
                      fill="none"
                      stroke="var(--chart-5)"
                      strokeWidth={1.8}
                      strokeDasharray="4 4"
                      strokeLinejoin="round"
                      opacity={0.7}
                    />
                  )}
                  <polyline
                    className="drill-poly"
                    points={pts.map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {subPts.map((p) => {
                    const lp = P(scoreToRadius(p.s.score) + 22, p.a);
                    const sel = selected?.type === "subcategory" && selected.name === p.s.name;
                    const hov = subHover === p.s.id;
                    const active = sel || hov;
                    return (
                      <g
                        key={p.s.id}
                        data-drill-sub
                        className="drill-sub cursor-pointer"
                        onClick={() => selectSub(drillCat, p.s)}
                        onMouseEnter={() => setSubHover(p.s.id)}
                        onMouseLeave={() => setSubHover(null)}
                      >
                        <title>
                          {p.s.name}: standard score {Math.round(p.s.score)}
                        </title>
                        {/* soft halo that blooms on hover */}
                        <circle
                          cx={n2(p.x)}
                          cy={n2(p.y)}
                          r={active ? 12 : 8}
                          fill={color}
                          opacity={active ? 0.16 : 0}
                          style={{ transition: "opacity .2s, r .2s" }}
                        />
                        <circle
                          cx={n2(p.x)}
                          cy={n2(p.y)}
                          r={active ? 6 : 4.5}
                          fill={color}
                          fillOpacity={active ? 1 : 0.9}
                          stroke="var(--card)"
                          strokeWidth={1.5}
                          style={{ transition: "r .2s" }}
                        />
                        <text
                          x={n2(p.x)}
                          y={n2(p.y) - (active ? 15 : 13)}
                          textAnchor="middle"
                          className="font-mono"
                          fontSize={active ? 13 : 11.5}
                          fontWeight={700}
                          fill={color}
                          stroke="var(--background)"
                          strokeWidth={2.2}
                          paintOrder="stroke"
                          style={{ transition: "font-size .2s" }}
                        >
                          {Math.round(p.s.score)}
                        </text>
                        <text
                          x={n2(lp.x)}
                          y={n2(lp.y)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={10.5}
                          fontWeight={active ? 700 : 500}
                          fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
                          stroke="var(--background)"
                          strokeWidth={2}
                          paintOrder="stroke"
                          style={{ transition: "fill .2s" }}
                        >
                          {p.s.name}
                        </text>
                      </g>
                    );
                  })}
                  {!scrollDrill && (
                    <text
                      x={C}
                      y={26}
                      textAnchor="middle"
                      className="font-display"
                      fontSize={24}
                      fontWeight={700}
                      fill="var(--foreground)"
                    >
                      {drillCat.name}
                    </text>
                  )}
                </g>
              );
            })()}

          {/* --- center hub (breathing) --- */}
          <g className="inst-hub">
            <circle cx={C} cy={C} r={42} fill="url(#inst-hub)" />
            <circle cx={C} cy={C} r={29} fill="var(--card)" stroke="var(--border)" strokeWidth={1}>
              {!reduceMotion && (
                <animate attributeName="r" values="29;30.2;29" dur="3.8s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx={C} cy={C} r={29} fill="none" stroke="var(--psych)" strokeWidth={1} opacity={0.4} />
            <text
              x={C}
              y={C - 3}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono"
              fontSize={22}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {overall}
            </text>
            <text
              x={C}
              y={C + 13}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fontWeight={600}
              fill="var(--muted-foreground)"
              letterSpacing="0.16em"
            >
              OVERALL
            </text>
          </g>
        </svg>
        </div>

        {/* hover readout (full view, manual hover only — suppressed during a scroll tour) */}
        {!drill && focusIndex == null && hover !== null && cats[hover] && (
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-xl border border-border bg-popover/95 px-4 py-2.5 text-center shadow-lg backdrop-blur-sm">
            <div className="text-sm font-semibold text-foreground">{cats[hover].name}</div>
            <div className="mt-0.5 font-mono text-xs text-muted-foreground" data-numeric>
              standard score {Math.round(cats[hover].score)}
            </div>
          </div>
        )}

        {/* drill: back to all areas (only for a manual click-drill; the tour uses scroll) */}
        {drill && !scrollDrill && (
          <button
            type="button"
            onClick={exitDrill}
            className="absolute left-3 top-16 z-20 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All areas
          </button>
        )}

        {/* detail panel for the selected item */}
        {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* controls */}
      {!hideControls && (onToggleNames || onExpand) && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {onToggleNames && (
            <button
              type="button"
              onClick={onToggleNames}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {showFullNames ? "First letter" : "Full names"}
            </button>
          )}
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4" />
              </svg>
              Expand
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ item, onClose }: { item: SelectedItem; onClose: () => void }) {
  const score = Math.round(item.score);
  const delta = item.snapshotScore != null ? score - Math.round(item.snapshotScore) : null;
  const fromMean = score - 100;
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`${item.name} details`}
      className="absolute right-3 top-16 z-10 w-60 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between">
        <span
          className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          {item.type === "subcategory" ? "subtest" : item.type}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h4 className="mt-2 font-display text-lg font-semibold leading-tight text-foreground">{item.name}</h4>
      {item.categoryName && <p className="text-xs text-muted-foreground">in {item.categoryName}</p>}

      <div className="mt-3 flex items-end gap-2">
        <span className="font-mono text-4xl font-semibold leading-none text-foreground" data-numeric>
          {score}
        </span>
        {delta != null && (
          <span
            className="mb-1 font-mono text-xs font-semibold"
            style={{ color: delta > 0 ? "var(--chart-2)" : delta < 0 ? "var(--destructive)" : "var(--muted-foreground)" }}
            data-numeric
          >
            {delta > 0 ? `+${delta}` : delta} vs before
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Classification</dt>
          <dd className="font-medium text-foreground">{classificationOf(score)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Percentile</dt>
          <dd className="font-mono text-foreground" data-numeric>
            ~{ordinal(percentileOf(score))}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">From the mean</dt>
          <dd className="font-mono text-foreground" data-numeric>
            {sdText(score)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Distance from 100</dt>
          <dd
            className="font-mono"
            style={{ color: fromMean >= 0 ? "var(--chart-2)" : "var(--destructive)" }}
            data-numeric
          >
            {fromMean >= 0 ? `+${fromMean}` : fromMean}
          </dd>
        </div>
      </dl>
    </div>
  );
}
