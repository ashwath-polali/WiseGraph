"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { normalPdf, jitterForKey } from "@/components/charts/class/geometry";
import { wedgeColor } from "@/components/charts/class/palette";
import { classificationOf, percentileOf, sdText, ordinal, normalCdf } from "@/lib/scoreStats";
import type { ClassScoreSummary } from "@/types/scores";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

/* ------------------------------------------------------------------ *
 * WiseGraph — the bell instrument.
 * Every standard score placed on the normal distribution (mean 100, SD 15):
 * a large luminous curve that draws itself on, category lollipops + subtest
 * dots on the curve, a cursor scrubber that reads the percentile at any point,
 * and the snapshot "before" ghost. Pure SVG, so it prints and exports.
 * ------------------------------------------------------------------ */

// Geometry constants exported (Step 0) so the landing morph bridge reads the
// bell's real coordinate space, not a lookalike.
export const W = 1000;
export const H = 520;
export const PAD_L = 46;
const PAD_R = 46;
const PAD_T = 40;
const PAD_B = 52;
export const PLOT_W = W - PAD_L - PAD_R;
export const BASE_Y = H - PAD_B;
const PLOT_H = H - PAD_T - PAD_B;
const PEAK = normalPdf(100, 100, 15);
const K = (PLOT_H * 0.94) / PEAK;
const TICKS = [60, 70, 85, 100, 115, 130, 150];
const n2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (s: number) => Math.max(60, Math.min(150, s));

export const mapX = (s: number) => PAD_L + ((clamp(s) - 60) / 90) * PLOT_W;
export const curveY = (s: number) => BASE_Y - normalPdf(clamp(s), 100, 15) * K;

const COLOR_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-5", "--chart-6"];
const colorOf = (i: number) => `var(${COLOR_TOKENS[i % COLOR_TOKENS.length]})`;

type Sub = { id: string; name: string; score: number };
type Cat = { id: string; name: string; score: number; subs: Sub[] };
type Selected = { type: "overall" | "category" | "subcategory"; name: string; score: number; categoryName?: string; snapshotScore?: number };
export type SnapshotData = { scores: { categoryId: string; subcategoryId: string | null; standardScore: number }[] };

type Props = {
  evaluation: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
  showFullNames?: boolean;
  onToggleNames?: () => void;
  onExpand?: () => void;
  comparisonSnapshotId?: string | null;
  focusIndex?: number | null;
  hideControls?: boolean;
  /** static "before" snapshot for the landing — renders the ghost with zero network. */
  snapshotOverride?: SnapshotData;
};

/** the smooth normal curve as an SVG path (open, for the stroke + draw-on). */
function curvePath() {
  let d = "";
  for (let s = 60; s <= 150; s += 1.5) {
    d += `${s === 60 ? "M" : "L"} ${n2(mapX(s))} ${n2(curveY(s))} `;
  }
  return d.trim();
}
const CURVE = curvePath();
const AREA = `${CURVE} L ${n2(mapX(150))} ${BASE_Y} L ${n2(mapX(60))} ${BASE_Y} Z`;

export function StudentBellInstrument({
  evaluation,
  svgRef,
  showFullNames = false,
  onToggleNames,
  onExpand,
  comparisonSnapshotId,
  focusIndex,
  hideControls = false,
  snapshotOverride,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [scrub, setScrub] = useState<number | null>(null); // cursor score, or null
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [subHover, setSubHover] = useState<string | null>(null);

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
  const overall =
    evaluation.students[0]?.overallScore ??
    Math.round(cats.reduce((a, c) => a + c.score, 0) / Math.max(cats.length, 1));

  // rank by score so labels near the crowded peak can stagger vertically
  const catRank = useMemo(() => {
    const m = new Map<string, number>();
    [...cats].sort((a, b) => a.score - b.score).forEach((c, idx) => m.set(c.id, idx));
    return m;
  }, [cats]);

  useEffect(() => {
    if (snapshotOverride !== undefined) {
      setSnapshot(snapshotOverride);
      return;
    }
    if (!comparisonSnapshotId) return setSnapshot(null);
    let live = true;
    fetch(`/api/snapshots/${comparisonSnapshotId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && setSnapshot(d ?? null))
      .catch(() => live && setSnapshot(null));
    return () => {
      live = false;
    };
  }, [comparisonSnapshotId, snapshotOverride]);

  useEffect(() => {
    if (focusIndex === undefined) return;
    setHover(focusIndex != null && focusIndex >= 0 && focusIndex < cats.length ? focusIndex : null);
  }, [focusIndex, cats.length]);

  // categories can be reconfigured under us — drop any stale selection
  useEffect(() => {
    setSelected(null);
  }, [evaluation]);

  // Escape closes the detail panel
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const snapCat = (id: string) =>
    snapshot?.scores.find((s) => s.categoryId === id && s.subcategoryId === null)?.standardScore ?? null;

  const root = useRef<HTMLDivElement>(null);
  const svgEl = useRef<SVGSVGElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        setReduceMotion(true);
        setReady(true);
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          gsap.set(q(".bell-curve"), { clearProps: "strokeDasharray,strokeDashoffset" });
          setReady(true);
        },
      });
      tlRef.current = tl;
      tl.from(q(".bell-axis"), { opacity: 0, duration: 0.4, stagger: 0.02 })
        .from(q(".bell-area"), { opacity: 0, duration: 0.7 }, "-=0.1")
        .from(q(".bell-curve"), { drawSVG: 0, duration: 1.1, ease: "power1.inOut" }, "<")
        .from(q(".bell-stem"), { scaleY: 0, transformOrigin: "bottom", duration: 0.5, stagger: 0.06 }, "-=0.5")
        .from(q(".bell-dot"), { scale: 0, transformOrigin: "50% 50%", duration: 0.4, stagger: 0.03, ease: "back.out(1.7)" }, "-=0.35")
        .from(q(".bell-mk-label"), { opacity: 0, duration: 0.4, stagger: 0.03 }, "-=0.3")
        .from(q(".bell-overall"), { opacity: 0, y: -10, duration: 0.5 }, "-=0.4");
    },
    { scope: root },
  );

  useEffect(() => {
    return () => {
      tlRef.current?.kill();
    };
  }, []);

  // when a domain focuses (scroll tour), bloom its subtests open
  useGSAP(
    () => {
      if (hover == null || reduceMotion) return;
      const q = gsap.utils.selector(root);
      gsap.from(q(`[data-bellsub="${hover}"]`), {
        scale: 0.4,
        opacity: 0.3,
        transformOrigin: "50% 50%",
        duration: 0.4,
        stagger: 0.06,
        ease: "back.out(1.7)",
      });
    },
    { dependencies: [hover], scope: root },
  );

  const onMove = (e: React.MouseEvent) => {
    const svg = svgEl.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const xRatio = (e.clientX - r.left) / r.width;
    const vx = xRatio * W;
    if (vx < PAD_L || vx > W - PAD_R) return setScrub(null);
    setScrub(Math.round(60 + ((vx - PAD_L) / PLOT_W) * 90));
  };

  const selCat = (c: Cat) => setSelected({ type: "category", name: c.name, score: c.score, snapshotScore: snapCat(c.id) ?? undefined });
  const selSub = (c: Cat, s: Sub) => setSelected({ type: "subcategory", name: s.name, score: s.score, categoryName: c.name });

  const setRefs = (el: SVGSVGElement | null) => {
    svgEl.current = el;
    if (typeof svgRef === "function") svgRef(el);
    else if (svgRef) (svgRef as React.MutableRefObject<SVGSVGElement | null>).current = el;
  };

  const focused = hover;

  return (
    <div ref={root} className="relative flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <svg
          ref={setRefs}
          viewBox={`0 0 ${W} ${H}`}
          className="h-full w-full overflow-visible"
          onMouseMove={onMove}
          onMouseLeave={() => {
            setScrub(null);
            if (focusIndex === undefined) setHover(null);
          }}
        >
          <defs>
            <linearGradient id="bell-area-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="var(--psych)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--psych)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="bell-scrub-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          {/* --- axis + grid --- */}
          <g>
            {/* ±1 SD band 85–115 */}
            <rect
              className="bell-axis"
              x={n2(mapX(85))}
              y={PAD_T}
              width={n2(mapX(115) - mapX(85))}
              height={BASE_Y - PAD_T}
              fill="var(--muted)"
              opacity={0.28}
            />
            {TICKS.map((s) => (
              <line
                key={s}
                className="bell-axis"
                x1={n2(mapX(s))}
                y1={PAD_T}
                x2={n2(mapX(s))}
                y2={BASE_Y}
                stroke="var(--border)"
                strokeWidth={s === 100 ? 1.1 : 0.7}
                strokeDasharray={s === 100 ? "none" : "2 7"}
                opacity={s === 100 ? 0.85 : 0.55}
              />
            ))}
            <line className="bell-axis" x1={PAD_L} y1={BASE_Y} x2={W - PAD_R} y2={BASE_Y} stroke="var(--border)" strokeWidth={1} />
            {TICKS.map((s) => (
              <text
                key={`t-${s}`}
                className="bell-axis font-mono"
                x={n2(mapX(s))}
                y={BASE_Y + 20}
                textAnchor="middle"
                fontSize={13}
                fill="var(--muted-foreground)"
              >
                {s}
              </text>
            ))}
            <text className="bell-axis font-mono" x={W / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)" letterSpacing="0.12em">
              STANDARD SCORE
            </text>
          </g>

          {/* --- cursor scrubber (fills the area to the left = percentile) --- */}
          {scrub != null && (
            <g data-export="hide" style={{ pointerEvents: "none" }}>
              <clipPath id="bell-scrub-clip">
                <rect x={PAD_L} y={PAD_T - 10} width={n2(mapX(scrub) - PAD_L)} height={BASE_Y - PAD_T + 10} />
              </clipPath>
              <path d={AREA} fill="url(#bell-scrub-fill)" clipPath="url(#bell-scrub-clip)" />
              <line x1={n2(mapX(scrub))} y1={n2(curveY(scrub))} x2={n2(mapX(scrub))} y2={BASE_Y} stroke="var(--chart-3)" strokeWidth={1.4} strokeDasharray="3 3" />
              <circle cx={n2(mapX(scrub))} cy={n2(curveY(scrub))} r={4} fill="var(--chart-3)" stroke="var(--card)" strokeWidth={1.5} />
            </g>
          )}

          {/* --- the curve --- */}
          <path className="bell-area" d={AREA} fill="url(#bell-area-fill)" />
          <path
            className="bell-curve"
            d={CURVE}
            fill="none"
            stroke="var(--psych)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* --- category lollipops + subtest dots --- */}
          {cats.map((cat, i) => {
            const dim = focused != null && focused !== i;
            const on = focused === i;
            const cx = mapX(cat.score);
            const cy = curveY(cat.score);
            const color = colorOf(i);
            return (
              <g key={cat.id} data-export="show" style={{ opacity: dim ? 0.28 : 1, transition: "opacity .25s" }}>
                {/* subtests first (under the category dot) — they bloom open when the domain is focused */}
                {cat.subs.map((s) => {
                  const sx = mapX(s.score);
                  const sy = curveY(s.score) + jitterForKey(s.id, 9);
                  const hov = subHover === s.id;
                  const active = on || hov;
                  const cx = mapX(cat.score);
                  const cy = curveY(cat.score);
                  return (
                    <g
                      key={s.id}
                      data-bellsub={i}
                      className="bell-sub cursor-pointer"
                      onClick={() => selSub(cat, s)}
                      onMouseEnter={() => setSubHover(s.id)}
                      onMouseLeave={() => setSubHover(null)}
                    >
                      <title>
                        {s.name}: standard score {Math.round(s.score)}
                      </title>
                      {/* fan connector from the category dot, drawn only when the domain is open */}
                      {on && (
                        <line x1={n2(cx)} y1={n2(cy)} x2={n2(sx)} y2={n2(sy)} stroke={color} strokeWidth={0.8} opacity={0.3} />
                      )}
                      {active && <circle cx={n2(sx)} cy={n2(sy)} r={11} fill={color} opacity={0.14} style={{ transition: "opacity .2s" }} />}
                      <circle
                        className="bell-dot"
                        cx={n2(sx)}
                        cy={n2(sy)}
                        r={active ? 5.5 : 3.6}
                        fill={color}
                        fillOpacity={active ? 0.95 : 0.6}
                        stroke="var(--card)"
                        strokeWidth={1.2}
                        style={{ transition: "r .2s, fill-opacity .2s" }}
                      />
                      {(active || showFullNames) && (
                        <text
                          className="bell-mk-label"
                          x={n2(sx)}
                          y={n2(sy) - (active ? 12 : 9)}
                          textAnchor="middle"
                          fontSize={active ? 10 : 8.5}
                          fontWeight={active ? 700 : 500}
                          fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
                          stroke="var(--background)"
                          strokeWidth={2}
                          paintOrder="stroke"
                          style={{ transition: "font-size .15s" }}
                        >
                          {showFullNames ? s.name : s.name.charAt(0).toUpperCase()}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* category lollipop */}
                <line className="bell-stem" x1={n2(cx)} y1={BASE_Y} x2={n2(cx)} y2={n2(cy)} stroke={color} strokeWidth={on ? 2.4 : 1.6} opacity={0.7} />
                <g className="cursor-pointer" onClick={() => selCat(cat)}>
                  <title>
                    {cat.name}: standard score {Math.round(cat.score)}
                  </title>
                  <circle className="bell-dot" cx={n2(cx)} cy={n2(cy)} r={on ? 8 : 6.5} fill={color} stroke="var(--card)" strokeWidth={2} style={{ transition: "r .15s" }} />
                  {(() => {
                    const lift = 14 + ((catRank.get(cat.id) ?? 0) % 2) * 18;
                    const ly = cy - lift;
                    return (
                      <>
                        {lift > 20 && <line x1={n2(cx)} y1={n2(cy) - 9} x2={n2(cx)} y2={n2(ly) + 5} stroke={color} strokeWidth={0.8} opacity={0.4} />}
                        <text className="bell-mk-label" x={n2(cx)} y={n2(ly)} textAnchor="middle" fontSize={12} fontWeight={on ? 700 : 600} fill="var(--foreground)" stroke="var(--background)" strokeWidth={3} paintOrder="stroke">
                          {cat.name}
                        </text>
                      </>
                    );
                  })()}
                </g>
              </g>
            );
          })}

          {/* --- overall marker --- */}
          <g className="bell-overall cursor-pointer" onClick={() => setSelected({ type: "overall", name: "Overall", score: overall })}>
            <title>Overall: standard score {overall}</title>
            <line x1={n2(mapX(overall))} y1={n2(curveY(overall))} x2={n2(mapX(overall))} y2={PAD_T - 12} stroke="var(--foreground)" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.6} />
            <circle cx={n2(mapX(overall))} cy={n2(curveY(overall))} r={5.5} fill="var(--foreground)" stroke="var(--card)" strokeWidth={2} />
            <g transform={`translate(${n2(mapX(overall))} ${PAD_T - 12})`}>
              <rect x={-46} y={-26} width={92} height={26} rx={13} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
              <text x={-30} y={-13} dominantBaseline="central" className="font-mono" fontSize={13} fontWeight={700} fill="var(--foreground)">
                {overall}
              </text>
              <text x={10} y={-13} dominantBaseline="central" fontSize={8} fontWeight={600} letterSpacing="0.1em" fill="var(--muted-foreground)">
                OVERALL
              </text>
            </g>
          </g>

          {/* --- snapshot ("before") ghosts + movement connectors --- */}
          {snapshot &&
            cats.map((cat, i) => {
              const before = snapCat(cat.id);
              if (before == null) return null;
              const bx = mapX(before);
              const by = curveY(before);
              const nx = mapX(cat.score);
              const ny = curveY(cat.score);
              return (
                <g key={`snap-${cat.id}`} style={{ pointerEvents: "none", opacity: focused != null && focused !== i ? 0.2 : 0.8 }}>
                  <line x1={n2(bx)} y1={n2(by)} x2={n2(nx)} y2={n2(ny)} stroke="var(--chart-5)" strokeWidth={1.4} strokeDasharray="3 3" />
                  <circle cx={n2(bx)} cy={n2(by)} r={4} fill="var(--card)" stroke="var(--chart-5)" strokeWidth={1.6} />
                </g>
              );
            })}
        </svg>

        {/* scrubber readout */}
        {scrub != null && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-border bg-popover/95 px-3 py-1.5 text-center shadow-md backdrop-blur-sm"
            style={{ left: `${((mapX(scrub) - PAD_L) / PLOT_W) * (100 - 8) + 4}%`, transform: "translateX(-50%)" }}
          >
            <div className="font-mono text-sm font-semibold text-foreground" data-numeric>
              {scrub}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground" data-numeric>
              {ordinal(percentileOf(scrub))} pct · {Math.round(normalCdf(scrub) * 100)}% below
            </div>
          </div>
        )}

        {selected && <BellDetailPanel item={selected} onClose={() => setSelected(null)} />}
      </div>

      {!hideControls && (onToggleNames || onExpand) && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {onToggleNames && (
            <button type="button" onClick={onToggleNames} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {showFullNames ? "First letter" : "Full names"}
            </button>
          )}
          {onExpand && (
            <button type="button" onClick={onExpand} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
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

function BellDetailPanel({ item, onClose }: { item: Selected; onClose: () => void }) {
  const score = Math.round(item.score);
  const delta = item.snapshotScore != null ? score - Math.round(item.snapshotScore) : null;
  const fromMean = score - 100;
  return (
    <div role="dialog" aria-label={`${item.name} details`} className="absolute right-3 top-16 z-10 w-60 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between">
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {item.type === "subcategory" ? "subtest" : item.type}
        </span>
        <button type="button" onClick={onClose} className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <h4 className="mt-2 font-display text-lg font-semibold leading-tight text-foreground">{item.name}</h4>
      {item.categoryName && <p className="text-xs text-muted-foreground">in {item.categoryName}</p>}
      <div className="mt-3 flex items-end gap-2">
        <span className="font-mono text-4xl font-semibold leading-none text-foreground" data-numeric>{score}</span>
        {delta != null && (
          <span className="mb-1 font-mono text-xs font-semibold" style={{ color: delta > 0 ? "var(--chart-2)" : delta < 0 ? "var(--destructive)" : "var(--muted-foreground)" }} data-numeric>
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
          <dd className="font-mono text-foreground" data-numeric>~{ordinal(percentileOf(score))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">From the mean</dt>
          <dd className="font-mono text-foreground" data-numeric>{sdText(score)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Distance from 100</dt>
          <dd className="font-mono" style={{ color: fromMean >= 0 ? "var(--chart-2)" : "var(--destructive)" }} data-numeric>
            {fromMean >= 0 ? `+${fromMean}` : fromMean}
          </dd>
        </div>
      </dl>
    </div>
  );
}
