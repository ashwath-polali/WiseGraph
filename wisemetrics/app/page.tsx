// app/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useEffect, useRef } from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-20 pt-10 sm:pt-16">
        {/* Top nav */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Graph icon */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-sky-400"
                aria-hidden="true"
              >
                <polyline
                  points="3 16 9 10 13 14 21 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="10" r="1.1" fill="currentColor" />
                <circle cx="13" cy="14" r="1.1" fill="currentColor" />
                <circle cx="21" cy="6" r="1.1" fill="currentColor" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-100">
              WiseGraph
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-slate-400">
            {/* Routes live at app/(auth)/login and app/(auth)/signup → /login, /signup */}
            <Link href="/login" className="hover:text-slate-100">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="text-xs">Start for free</Button>
            </Link>
          </nav>
        </header>

        {/* Hero copy */}
        <section className="mt-16 flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl md:text-6xl">
            Visual intelligence for{" "}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              student data
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            WiseGraph turns raw standard scores into clean, interactive visuals
            so you can see growth, gaps, and strengths in a single glance,
            instead of digging through spreadsheets.
          </p>
        </section>

        {/* Hero visualization band */}
        <section className="mt-14 w-full">
          <InteractiveGraphBand />
        </section>

        {/* Value props */}
        <section className="mt-12 grid w-full gap-6 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold text-slate-100">
              See the whole class
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Instantly spot outliers and trends instead of paging through
              many reports.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold text-slate-100">
              Drill into subskills
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Move from overall scores to specific strengths and gaps in a few
              clicks.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold text-slate-100">
              Shareable visuals
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Use clear, exportable charts in PLCs, family conferences, and
              student goal‑setting.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Interactive graph band where only the region near the cursor expands.
 */
function InteractiveGraphBand() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<{ x: number; y: number; inside: boolean }>({
    x: 0.5,
    y: 0.5,
    inside: false,
  });
  const pathMainRef = useRef<SVGPathElement | null>(null);
  const pathARef = useRef<SVGPathElement | null>(null);
  const pathBRef = useRef<SVGPathElement | null>(null);
  const pathCRef = useRef<SVGPathElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Continuous redraw using current cursor state
  useEffect(() => {
    const updatePaths = () => {
      const { x, y, inside } = cursorRef.current;
      const hover = inside ? { x, y } : null;

      if (pathMainRef.current)
        pathMainRef.current.setAttribute(
          "d",
          generateWiseGraphPath(0, 1, hover)
        );
      if (pathARef.current)
        pathARef.current.setAttribute(
          "d",
          generateWiseGraphPath(0.12, 0.95, hover)
        );
      if (pathBRef.current)
        pathBRef.current.setAttribute(
          "d",
          generateWiseGraphPath(-0.12, 0.95, hover)
        );
      if (pathCRef.current)
        pathCRef.current.setAttribute(
          "d",
          generateWiseGraphPath(0.24, 0.9, hover)
        );

      rafRef.current = requestAnimationFrame(updatePaths);
    };

    rafRef.current = requestAnimationFrame(updatePaths);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mouse tracking within the band
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0..1
      const y = (e.clientY - rect.top) / rect.height; // 0..1
      cursorRef.current = {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
        inside: true,
      };
    };

    const handleLeave = () => {
      cursorRef.current = { x: 0.5, y: 0.5, inside: false };
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-72 w-full overflow-hidden rounded-3xl border border-sky-500/15 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 sm:h-80"
    >
      <div className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 600 300"
          className="h-full w-full opacity-70"
          preserveAspectRatio="none"
        >
          {/* vertical grid */}
          {[...Array(13)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i / 12) * 600}
              y1={0}
              x2={(i / 12) * 600}
              y2={300}
              stroke="rgba(15,23,42,0.7)"
              strokeWidth="1"
            />
          ))}
          {/* horizontal grid */}
          {[...Array(7)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i / 6) * 300}
              x2={600}
              y2={(i / 6) * 300}
              stroke="rgba(15,23,42,0.7)"
              strokeWidth="1"
            />
          ))}

          {/* main “class trend” curve */}
          <path
            ref={pathMainRef}
            d={generateWiseGraphPath(0)}
            fill="none"
            stroke="url(#strokeGradMain)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* secondary curves */}
          <path
            ref={pathARef}
            d={generateWiseGraphPath(0.12)}
            fill="none"
            stroke="rgba(56,189,248,0.5)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            ref={pathBRef}
            d={generateWiseGraphPath(-0.12)}
            fill="none"
            stroke="rgba(129,140,248,0.5)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            ref={pathCRef}
            d={generateWiseGraphPath(0.24)}
            fill="none"
            stroke="rgba(96,165,250,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* vertical reference lines */}
          {[0.2, 0.5, 0.8].map((t, idx) => (
            <line
              key={`ref-${idx}`}
              x1={t * 600}
              y1={40}
              x2={t * 600}
              y2={260}
              stroke="rgba(148,163,184,0.4)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          <defs>
            <linearGradient id="strokeGradMain" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/**
 * Generate a complex “graph-like” curve across 600×300 space.
 * offsetFactor: shifts phase/amplitude for each series.
 * baseScale: base vertical scale of this series.
 * hover: {x,y} in 0..1; only region near hover expands.
 */
function generateWiseGraphPath(
  offsetFactor: number = 0,
  baseScale: number = 1,
  hover:
    | {
        x: number;
        y: number;
      }
    | null = null
): string {
  const width = 600;
  const height = 300;
  const midY = height / 2;

  const baseAmp = height * (0.26 + offsetFactor * 0.08) * baseScale;

  const points: string[] = [];
  const samples = 260;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples; // 0..1 along x
    const x = t * width;

    const trend = Math.sin(t * Math.PI * 2 * 0.8 + offsetFactor);
    const seasonal = Math.sin(
      t * Math.PI * 2 * 2.4 + 0.7 + offsetFactor * 2
    );
    const fine = Math.sin(t * Math.PI * 2 * 5.9 + 1.3 + offsetFactor * 3);

    // local expansion if close to hover.x
    let localScale = 1;
    if (hover) {
      const dx = Math.abs(t - hover.x); // 0 at cursor
      const radius = 0.18; // influence width
      if (dx < radius) {
        const falloff = 1 - dx / radius; // 0..1
        localScale = 1 + falloff * 0.7; // up to +70% locally
      }
    }

    const amp = baseAmp * localScale;

    const y =
      midY +
      trend * (amp * 0.8) +
      seasonal * (amp * 0.45) +
      fine * (amp * 0.18);

    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}
