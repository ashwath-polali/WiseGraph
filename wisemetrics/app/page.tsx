"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShaderBackground } from "@/components/landing/ShaderBackground";
import { MagneticButton } from "@/components/landing/HeroStory";
import { DEMO_EVALUATION } from "@/lib/demoEvaluation";

const StudentPolarInstrument = dynamic(
  () => import("@/components/charts/student/StudentPolarInstrument").then((m) => m.StudentPolarInstrument),
  { ssr: false },
);

const ENTER = [0.22, 1, 0.36, 1] as const;
const HEADLINE = ["Test", "scores", "a", "parent", "can", "actually", "read."];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh text-foreground">
      <ShaderBackground />

      {/* ===== running head (print chrome + nav) ===== */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="11" className="stroke-border" strokeWidth="1" />
              <path d="M12 12 L12 2.5 A9.5 9.5 0 0 1 20.2 7.3 Z" className="fill-primary" />
              <path d="M12 12 L20.2 7.3 A9.5 9.5 0 0 1 18.7 18.7 Z" className="fill-primary/45" />
              <path d="M12 12 L18.7 18.7 A9.5 9.5 0 0 1 5.3 18.7 Z" className="fill-psych/60" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">WiseGraph</span>
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:block">
            Psychoeducational evaluation · Grade 4
          </span>
          <nav className="flex items-center gap-1.5">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
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
        </div>
      </header>

      {/* fixed folio */}
      <div className="pointer-events-none fixed bottom-5 right-6 z-40 hidden font-mono text-[11px] tracking-[0.2em] text-muted-foreground/70 sm:block">
        01 / 05
      </div>

      {/* ===== Chapter I — the cover, Figure 1 self-draws ===== */}
      <section className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-[1240px] items-center gap-6 px-5 py-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 lg:pr-4">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER }}
            className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-psych" />
            For teachers and school psychologists
          </motion.p>

          <h1 className="font-display text-[clamp(2.6rem,5vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em]">
            {HEADLINE.map((word, i) => (
              <span key={i} className="mr-[0.24em] inline-block overflow-hidden pb-[0.1em] align-bottom -mb-[0.1em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, ease: ENTER, delay: 0.1 + i * 0.06 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER, delay: 0.55 }}
            className="mt-6 max-w-[34rem] text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            WiseGraph draws the standardized scores you already have into a figure you can hand across a
            table, or project on a wall, and nobody needs the jargon explained.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ENTER, delay: 0.65 }}
            className="mt-8 flex items-center gap-2"
          >
            <MagneticButton>
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
            </MagneticButton>
            <Link href="/login">
              <Button variant="ghost" size="lg">Log in</Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: ENTER, delay: 0.95 }}
            className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70"
          >
            Scroll to read the figure
          </motion.p>
        </div>

        {/* Figure 1 — the real instrument, bleeding off the frame */}
        <div className="relative lg:col-span-7">
          <div className="mx-auto aspect-square w-full max-w-[min(92vw,620px)] lg:mr-[-4%] lg:max-w-[640px]">
            <StudentPolarInstrument evaluation={DEMO_EVALUATION} hideControls />
          </div>
          <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
            Fig. 1 — Radial profile, one evaluation
          </p>
        </div>
      </section>

      {/* ===== editorial interlude (placeholder until the chapters land) ===== */}
      <div className="mx-auto max-w-[1240px] px-5 pb-28">
        <section className="border-t border-border pt-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-20">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: ENTER }}
              className="font-display text-[1.9rem] font-medium leading-[1.12] tracking-tight text-balance sm:text-[2.6rem]"
            >
              From the whole class down to a single subskill.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: ENTER, delay: 0.1 }}
              className="flex flex-col justify-end gap-4 text-[15px] leading-relaxed text-muted-foreground"
            >
              <p>
                The overall profile and the score behind it live in the same view. Open a domain to find the
                subtest that is actually moving it.
              </p>
              <p>
                Then export a chart clean enough to read from the back of a room, or across a table from a
                parent who has never seen a standard score.
              </p>
            </motion.div>
          </div>
        </section>

        {/* colophon / close */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: ENTER }}
          className="relative mt-28 overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_32px_64px_-32px_oklch(0.245_0.015_75/0.2)]"
        >
          <h2 className="mx-auto max-w-xl font-display text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            Set up your first class.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            It takes a few minutes, and there is nothing to install.
          </p>
          <div className="mt-7 flex justify-center">
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
