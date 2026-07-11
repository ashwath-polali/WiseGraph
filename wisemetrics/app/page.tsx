"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShaderBackground } from "@/components/landing/ShaderBackground";
import { HeroStory, MagneticButton } from "@/components/landing/HeroStory";

const ENTER = [0.22, 1, 0.36, 1] as const;

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
        {/* What it does — asymmetric editorial, not a 3-up card grid */}
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
                The class overview and the score behind it live in the same view.
                Open a category to find the subskill that&apos;s actually moving
                it.
              </p>
              <p>
                Then export a chart clean enough to read from the back of a room,
                or across a table from a parent who&apos;s never seen a standard
                score.
              </p>
            </motion.div>
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
