"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingRadialHero } from "@/components/landing/LandingRadialHero";
import { useEffect, useRef, type ReactNode } from "react";

const ENTER = [0.22, 1, 0.36, 1] as const;

const HEADLINE = ["Test", "scores", "parents", "can", "actually", "read."];

const FEATURES = [
  {
    title: "See the whole class at once",
    body: "One chart for the whole roster. The student who's quietly slipping and the one who's way ahead both show up, instead of hiding in a stack of printouts.",
  },
  {
    title: "Follow a score down",
    body: "An overall number doesn't tell you why. Open a category, then a subskill, until you find the specific thing to work on.",
  },
  {
    title: "Made for the meeting",
    body: "Export a clean image for the projector or the handout. It still reads from the back of a PLC or across a conference table.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <Aurora />

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
            <MagneticButton>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </MagneticButton>
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>
        </header>

        <Hero />

        {/* Second act — the interactive trend band */}
        <section className="mt-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: ENTER }}
            className="mb-6 flex flex-col gap-1"
          >
            <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Watch a class move over a year.
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Each line is a cohort. Drag your cursor across to see where scores
              rise and where they flatten out.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: ENTER }}
          >
            <InteractiveGraphBand />
          </motion.div>
        </section>

        {/* Value props */}
        <section className="mt-28 border-t border-border pt-12">
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: ENTER, delay: i * 0.08 }}
              >
                <span className="font-mono text-xs text-muted-foreground" data-numeric>
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-display text-lg font-medium text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: ENTER }}
          className="relative mt-28 overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_32px_64px_-32px_oklch(0.245_0.015_75/0.2)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]"
          />
          <h2 className="relative mx-auto max-w-xl font-display text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            Set up your first class.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            It takes a few minutes, and there&apos;s nothing to install.
          </p>
          <div className="relative mt-7 flex justify-center">
            <MagneticButton>
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
            </MagneticButton>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  // cursor position within the hero, normalized to [-0.5, 0.5]
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring);
  const glowX = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), spring);
  const glowY = useSpring(useTransform(py, [-0.5, 0.5], [-16, 16]), spring);

  // scroll-linked: the hero visual recedes as you scroll past it
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const radialY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const radialOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -36]);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="mt-14 grid items-center gap-10 sm:mt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6"
    >
      <motion.div style={{ y: copyY }} className="flex flex-col items-start text-left">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: ENTER }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-psych" />
          For teachers and school psychologists
        </motion.p>

        {/* headline: each word rises out of a clip mask */}
        <h1 className="font-display text-[2.6rem] font-medium leading-[1.03] tracking-tight sm:text-6xl md:text-[4.1rem]">
          {HEADLINE.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]"
            >
              <motion.span
                className="inline-block"
                initial={{ y: "115%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: ENTER, delay: 0.08 + i * 0.07 }}
              >
                {word}
                {i < HEADLINE.length - 1 ? " " : ""}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ENTER, delay: 0.5 }}
          className="mt-5 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base"
        >
          Standardized tests come back as a page of numbers. WiseGraph turns them
          into charts you can read in a second, whether you&apos;re in class or
          sitting across from a parent.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ENTER, delay: 0.6 }}
          className="mt-8 flex items-center gap-2"
        >
          <MagneticButton>
            <Link href="/signup">
              <Button size="lg">Get started</Button>
            </Link>
          </MagneticButton>
          <Link href="/login">
            <Button variant="ghost" size="lg">
              Log in
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Live product visual: tilts toward the cursor, recedes on scroll */}
      <motion.div
        style={{ y: radialY, opacity: radialOpacity }}
        className="flex justify-center lg:justify-end"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: ENTER, delay: 0.2 }}
          className="[perspective:1200px]"
        >
          <motion.div
            style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
            className="relative"
          >
            <motion.div
              aria-hidden
              style={{ x: glowX, y: glowY }}
              className="pointer-events-none absolute inset-6 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklch,var(--psych)_18%,transparent),transparent_70%)] blur-2xl"
            />
            <LandingRadialHero />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* --------------------------------------------------------- Aurora BG */

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-52 h-[640px] w-[640px] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
        }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12rem] top-[-8rem] h-[600px] w-[600px] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, color-mix(in oklch, var(--psych) 13%, transparent), transparent 70%)",
        }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, -34, 0], y: [0, 40, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* --------------------------------------------------- Magnetic button */

function MagneticButton({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 300, damping: 18, mass: 0.4 });

  return (
    <motion.div
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.4);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------ Interactive band */

/**
 * A live class-trend band where only the region near the cursor expands,
 * drawn in WiseGraph's editorial palette with a shaded normative band.
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      cursorRef.current = {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
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
        <svg viewBox="0 0 600 300" className="h-full w-full" preserveAspectRatio="none">
          <rect x={0} y={300 * 0.33} width={600} height={300 * 0.34} fill="var(--muted)" opacity={0.55} />
          {[...Array(13)].map((_, i) => (
            <line key={`v-${i}`} x1={(i / 12) * 600} y1={0} x2={(i / 12) * 600} y2={300} stroke="var(--border)" strokeWidth="1" opacity={0.6} />
          ))}
          {[...Array(7)].map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={(i / 6) * 300} x2={600} y2={(i / 6) * 300} stroke="var(--border)" strokeWidth="1" opacity={0.6} />
          ))}
          <path ref={pathMainRef} d={generateWiseGraphPath(0)} fill="none" stroke="url(#landing-main)" strokeWidth="2.6" strokeLinecap="round" />
          <path ref={pathARef} d={generateWiseGraphPath(0.12)} fill="none" stroke="var(--chart-1)" strokeWidth="1.4" strokeLinecap="round" opacity={0.4} />
          <path ref={pathBRef} d={generateWiseGraphPath(-0.12)} fill="none" stroke="var(--chart-2)" strokeWidth="1.4" strokeLinecap="round" opacity={0.4} />
          <path ref={pathCRef} d={generateWiseGraphPath(0.24)} fill="none" stroke="var(--chart-4)" strokeWidth="1.2" strokeLinecap="round" opacity={0.32} />
          {[0.2, 0.5, 0.8].map((t, idx) => (
            <line key={`ref-${idx}`} x1={t * 600} y1={40} x2={t * 600} y2={260} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 5" />
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
        Class trend, live
      </div>
    </div>
  );
}

function generateWiseGraphPath(
  offsetFactor: number = 0,
  baseScale: number = 1,
  hover: { x: number; y: number } | null = null,
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
    let localScale = 1;
    if (hover) {
      const dx = Math.abs(t - hover.x);
      const radius = 0.18;
      if (dx < radius) localScale = 1 + (1 - dx / radius) * 0.7;
    }
    const amp = baseAmp * localScale;
    const y = midY + trend * (amp * 0.8) + seasonal * (amp * 0.45) + fine * (amp * 0.18);
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ");
}
