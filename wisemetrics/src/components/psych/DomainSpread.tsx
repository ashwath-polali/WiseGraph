"use client";

import { radiusForScore, wedgePath, SCORE_MIN, SCORE_MAX } from "@/components/charts/class/geometry";
import { wedgeColor } from "@/components/charts/class/palette";
import { classify, categoryReadout } from "@/lib/classification";

export type Domain = {
  id: string;
  name: string;
  score: number;
  subtests: { id: string; name: string; score: number }[];
};

const GLYPH = 128;
const GC = GLYPH / 2;
const GR = 56;

/** A small echo of the hero wedge — the same radial math, one domain. */
function MiniGlyph({ score, index, active }: { score: number; index: number; active: boolean }) {
  const color = wedgeColor(index);
  const r = radiusForScore(score, GR);
  // a wide wedge opening at the top, so it reads as a slice of the big chart
  const start = -Math.PI / 2 - 1.4;
  const end = -Math.PI / 2 + 1.4;
  const path = wedgePath(r, start, end, { pad: 0, corner: 3 });

  return (
    <svg viewBox={`0 0 ${GLYPH} ${GLYPH}`} className="h-[7.5rem] w-[7.5rem] overflow-visible">
      {/* just two references: the 150 boundary and the 100 mean ring */}
      <circle cx={GC} cy={GC} r={GR} fill="none" stroke="var(--border)" strokeWidth={0.8} opacity={0.6} />
      <circle
        cx={GC}
        cy={GC}
        r={radiusForScore(100, GR)}
        fill="none"
        stroke="var(--border)"
        strokeWidth={0.9}
        strokeDasharray="2 4"
        opacity={0.8}
      />
      <g transform={`translate(${GC} ${GC})`}>
        <path d={path} fill={color} fillOpacity={active ? 0.3 : 0.18} />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" opacity={active ? 1 : 0.9} />
      </g>
      {/* score marker where the wedge peaks */}
      <circle cx={GC} cy={GC - r} r={3.2} fill={color} stroke="var(--card)" strokeWidth={1.5} />
    </svg>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const bandStart = ((85 - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  const bandEnd = ((115 - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
  return (
    <div className="mt-5">
      <div className="relative h-1.5 rounded-full bg-muted">
        {/* average range 85–115 */}
        <div
          className="absolute inset-y-0 rounded-full bg-foreground/10"
          style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
        />
        {/* the marker */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
          style={{ left: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground/70" data-numeric>
        <span>60</span>
        <span>100</span>
        <span>150</span>
      </div>
    </div>
  );
}

export function DomainSpread({
  domain,
  index,
  active,
  onSelect,
}: {
  domain: Domain;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const color = wedgeColor(index);
  const band = classify(domain.score);
  const readout = categoryReadout(domain.score, domain.subtests);
  const flip = index % 2 === 1;

  return (
    <article
      onClick={() => onSelect(domain.id)}
      className={`domain-spread group cursor-pointer border-t py-9 transition-colors ${
        active ? "border-foreground/25" : "border-border"
      }`}
    >
      <div className="grid items-center gap-x-10 gap-y-6 md:grid-cols-12">
        {/* text */}
        <div className={`md:col-span-7 ${flip ? "md:order-2 md:pl-6" : ""}`}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-muted-foreground/60" data-numeric>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: band.color }} />
              {band.label}
            </span>
          </div>
          <div className="mt-2 flex items-end gap-4">
            <h3 className="font-display text-4xl font-semibold tracking-tight text-foreground">
              {domain.name}
            </h3>
            <span
              className="font-mono text-4xl font-semibold leading-none tracking-tight transition-transform group-hover:-translate-y-0.5"
              style={{ color }}
              data-numeric
            >
              {Math.round(domain.score)}
            </span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{readout}</p>
          <ScoreBar score={domain.score} color={color} />
        </div>

        {/* glyph */}
        <div className={`flex justify-center md:col-span-5 ${flip ? "md:order-1 md:justify-start" : "md:justify-end"}`}>
          <div className="relative">
            <MiniGlyph score={domain.score} index={index} active={active} />
          </div>
        </div>
      </div>

      {domain.subtests.length > 0 && (
        <div className={`mt-1 flex flex-wrap gap-x-5 gap-y-1 ${flip ? "md:pl-6" : ""}`}>
          {domain.subtests.map((s) => (
            <span key={s.id} className="font-mono text-[11px] text-muted-foreground/70" data-numeric>
              {s.name} <span className="text-foreground/80">{Math.round(s.score)}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
