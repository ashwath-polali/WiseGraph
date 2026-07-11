"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShaderBackground } from "@/components/landing/ShaderBackground";
import { HeroStory, MagneticButton } from "@/components/landing/HeroStory";

const ENTER = [0.22, 1, 0.36, 1] as const;

const FEATURES = [
  {
    title: "The whole class on one dial",
    body: "See every student's profile in a single view. The ones who need attention and the ones who are ahead show up side by side, not buried in separate reports.",
  },
  {
    title: "From a score to its subskills",
    body: "Open a category to see the subskills underneath it. You get what to work on, not just a number that says something is off.",
  },
  {
    title: "Made to share",
    body: "Export a clean chart for a report, a conference, or a projector. It reads on its own, without a legend or a walkthrough.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh text-foreground">
      <ShaderBackground />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
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
        </div>
      </header>

      {/* Hero + scroll-driven chart story */}
      <HeroStory />

      <div className="mx-auto max-w-6xl px-5 pb-28">
        {/* Feature blocks */}
        <section className="border-t border-border pt-14">
          <div className="grid gap-x-12 gap-y-12 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: ENTER, delay: i * 0.08 }}
              >
                <span className="font-mono text-xs text-muted-foreground" data-numeric>
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-display text-xl font-medium text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing */}
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
            It takes a few minutes, and there&apos;s nothing to install.
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
