"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useEffect, useRef } from "react";

const ENTER = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  {
    title: "See the whole class",
    body: "Spot outliers and trends across every student at once, instead of paging through a stack of individual reports.",
  },
  {
    title: "Drill into subskills",
    body: "Move from an overall score down to the specific strength or gap driving it — in a click, not a spreadsheet.",
  },
  {
    title: "Made for the room",
    body: "Clean, exportable charts that hold up on a projector in PLCs, family conferences, and goal-setting meetings.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* ambient warm ground behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(58%_100%_at_50%_-12%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent)]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col px-5 pb-24 pt-6 sm:pt-8">
        {/* Nav */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="11" className="stroke-border" strokeWidth="1" />
              <path d="M12 12 L12 2.5 A9.5 9.5 0 0 1 20.2 7.3 Z" className="fill-primary" />
              <path d="M12 12 L20.2 7.3 A9.5 9.5 0 0 1 18.7 18.7 Z" className="fill-primary/45" />
              <path d="M12 12 L18.7 18.7 A9.5 9.5 0 0 1 5.3 18.7 Z" className="fill-psych/60" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">WiseGraph</span>
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-20 flex flex-col items-center text-center sm:mt-28">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: ENTER }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-psych" />
            Built for school psychologists &amp; teachers
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER, delay: 0.05 }}
            className="font-display text-[2.5rem] font-medium leading-[1.04] tracking-tight text-balance sm:text-6xl md:text-[4.25rem]"
          >
            A student&apos;s whole story,
            <br className="hidden sm:block" /> in one honest picture.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER, delay: 0.12 }}
            className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            WiseGraph turns standardized assessment scores into clear radial and
            bell-curve visuals — so growth, gaps, and strengths read at a glance
            in classrooms, IEP meetings, and parent conferences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER, delay: 0.18 }}
            className="mt-8 flex items-center gap-3"
          >
            <Link href="/signup">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Log in
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Hero visualization */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: ENTER, delay: 0.25 }}
          className="mt-16 w-full"
        >
          <InteractiveGraphBand />
        </motion.section>

        {/* Value props — editorial numbered row */}
        <section className="mt-20 border-t border-border pt-10">
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, ease: ENTER, delay: i * 0.06 }}
              >
                <span className="font-mono text-xs text-muted-foreground" data-numeric>
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-medium text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * A live class-trend band where only the region near the cursor expands —
 * rethemed to WiseGraph's editorial palette (paper card, hairline grid, the
 * three score-series colors) with a shaded normative "average range" band.
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

  // continuous redraw using current cursor state
  useEffect(() => {
    const updatePaths = () => {
      const { x, y, inside } = cursorRef.current;
      const hover = inside ? { x, y } : null;

      if (pathMainRef.current)
        pathMainRef.current.setAttribute("d", generateWiseGraphPath(0, 1, hover));
      if (pathARef.current)
        pathARef.current.setAttribute("d", generateWiseGraphPath(0.12, 0.95, hover));
      if (pathBRef.current)
        pathBRef.current.setAttribute("d", generateWiseGraphPath(-0.12, 0.95, hover));
      if (pathCRef.current)
        pathCRef.current.setAttribute("d", generateWiseGraphPath(0.24, 0.9, hover));

      rafRef.current = requestAnimationFrame(updatePaths);
    };

    rafRef.current = requestAnimationFrame(updatePaths);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // mouse tracking
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
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
      className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_28px_56px_-28px_oklch(0.245_0.015_75/0.18)] sm:h-80"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_130%_at_50%_128%,color-mix(in_oklch,var(--primary)_7%,transparent),transparent)]"
      />
      <div className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 600 300"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          {/* normative "average range" band the trends weave through */}
          <rect
            x={0}
            y={300 * 0.33}
            width={600}
            height={300 * 0.34}
            fill="var(--muted)"
            opacity={0.55}
          />

          {/* grid */}
          {[...Array(13)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i / 12) * 600}
              y1={0}
              x2={(i / 12) * 600}
              y2={300}
              stroke="var(--border)"
              strokeWidth="1"
              opacity={0.6}
            />
          ))}
          {[...Array(7)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i / 6) * 300}
              x2={600}
              y2={(i / 6) * 300}
              stroke="var(--border)"
              strokeWidth="1"
              opacity={0.6}
            />
          ))}

          {/* main class trend curve */}
          <path
            ref={pathMainRef}
            d={generateWiseGraphPath(0)}
            fill="none"
            stroke="url(#landing-main)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* secondary curves in the score-series colors */}
          <path
            ref={pathARef}
            d={generateWiseGraphPath(0.12)}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={0.4}
          />
          <path
            ref={pathBRef}
            d={generateWiseGraphPath(-0.12)}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity={0.4}
          />
          <path
            ref={pathCRef}
            d={generateWiseGraphPath(0.24)}
            fill="none"
            stroke="var(--chart-4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={0.32}
          />

          {/* reference lines */}
          {[0.2, 0.5, 0.8].map((t, idx) => (
            <line
              key={`ref-${idx}`}
              x1={t * 600}
              y1={40}
              x2={t * 600}
              y2={260}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
          ))}

          <defs>
            <linearGradient id="landing-main" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-1)" />
              <stop offset="55%" stopColor="var(--chart-2)" />
              <stop offset="100%" stopColor="var(--chart-4)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="pointer-events-none absolute left-4 top-3.5 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
        Class trend · move your cursor
      </div>
    </div>
  );
}

/**
 * Generate a complex graph-like curve across a 600×300 space.
 * offsetFactor shifts amplitude per series; baseScale sets its vertical scale;
 * near the cursor (hover.x) the curve locally expands.
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
    const t = i / samples;
    const x = t * width;

    const trend = Math.sin(t * Math.PI * 2 * 0.8 + offsetFactor);
    const seasonal = Math.sin(t * Math.PI * 2 * 2.4 + 0.7 + offsetFactor * 2);
    const fine = Math.sin(t * Math.PI * 2 * 5.9 + 1.3 + offsetFactor * 3);

    // local expansion near the cursor
    let localScale = 1;
    if (hover) {
      const dx = Math.abs(t - hover.x);
      const radius = 0.18;
      if (dx < radius) {
        const falloff = 1 - dx / radius;
        localScale = 1 + falloff * 0.7;
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
