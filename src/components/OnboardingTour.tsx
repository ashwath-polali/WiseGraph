"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export type TourStep = {
  title: string;
  body: string;
  /** CSS selector for the element to spotlight; omit for a centered step */
  target?: string;
  /** which side of the target the tooltip sits on (auto-flips near edges) */
  placement?: "top" | "bottom" | "left" | "right";
};

const CARD_W = 340;
const GAP = 16;

export function OnboardingTour({
  steps,
  storageKey,
  enabled = true,
}: {
  steps: TourStep[];
  storageKey: string;
  /** the account hasn't been onboarded yet (server-decided, once ever) */
  enabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      if (enabled && !localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      /* private mode — just skip */
    }
  }, [storageKey, enabled]);

  const step = steps[i];

  const measure = useCallback(() => {
    if (!step?.target) return setRect(null);
    const el = document.querySelector(step.target) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // scroll the target into view, then measure once it settles
  useLayoutEffect(() => {
    if (!open) return;
    const el = step?.target ? (document.querySelector(step.target) as HTMLElement | null) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t = window.setTimeout(measure, 360);
    return () => clearTimeout(t);
  }, [open, i, step, measure]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "done");
    } catch {
      /* ignore */
    }
    // persist per account so it never shows again, on any device
    fetch("/api/onboarded", { method: "POST" }).catch(() => {});
    setOpen(false);
  }, [storageKey]);

  const next = () => (i < steps.length - 1 ? setI(i + 1) : finish());
  const back = () => setI((n) => Math.max(0, n - 1));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  if (!mounted || !open || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;

  // tooltip position
  let cardStyle: React.CSSProperties;
  let arrow: { left: number; top: number; rot: number } | null = null;
  let placement = step.placement ?? "bottom";

  if (rect) {
    const spaceBelow = vh - rect.bottom;
    const spaceRight = vw - rect.right;
    if (placement === "bottom" && spaceBelow < 200) placement = "top";
    if (placement === "top" && rect.top < 200) placement = "bottom";
    if (placement === "right" && spaceRight < CARD_W + 40) placement = "left";

    const clampX = (x: number) => Math.max(GAP, Math.min(vw - CARD_W - GAP, x));
    const clampY = (y: number) => Math.max(GAP, Math.min(vh - 220, y));

    if (placement === "bottom") {
      const left = clampX(rect.left + rect.width / 2 - CARD_W / 2);
      const top = rect.bottom + GAP;
      cardStyle = { left, top };
      arrow = { left: rect.left + rect.width / 2 - left - 6, top: -6, rot: 45 };
    } else if (placement === "top") {
      const left = clampX(rect.left + rect.width / 2 - CARD_W / 2);
      cardStyle = { left, bottom: vh - rect.top + GAP };
      arrow = { left: rect.left + rect.width / 2 - left - 6, top: undefined as unknown as number, rot: 45 };
    } else if (placement === "right") {
      cardStyle = { left: rect.right + GAP, top: clampY(rect.top) };
      arrow = { left: -6, top: 24, rot: 45 };
    } else {
      cardStyle = { right: vw - rect.left + GAP, top: clampY(rect.top) };
      arrow = { left: CARD_W - 6, top: 24, rot: 45 };
    }
  } else {
    cardStyle = { left: vw / 2 - CARD_W / 2, top: vh / 2 - 110 };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100000]" aria-live="polite" role="dialog" aria-label="Getting started">
      {/* dim + spotlight */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl transition-all duration-300 ease-out"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px color-mix(in srgb, var(--foreground) 62%, transparent)",
            outline: "2px solid var(--primary)",
            outlineOffset: "2px",
          }}
        />
      ) : (
        <div className="fixed inset-0" style={{ background: "color-mix(in srgb, var(--foreground) 62%, transparent)" }} />
      )}

      {/* skip — always reachable */}
      <button
        type="button"
        onClick={finish}
        className="fixed right-5 top-5 z-[100001] rounded-full border border-white/20 bg-black/30 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
      >
        Skip tour
      </button>

      {/* tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[100001] rounded-2xl border border-border bg-popover p-5 shadow-2xl"
          style={{ width: CARD_W, ...cardStyle }}
        >
          {arrow && (
            <div
              aria-hidden
              className="absolute h-3 w-3 rotate-45 border-border bg-popover"
              style={{
                left: arrow.left,
                ...(placement === "top" ? { bottom: -6, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" } : {}),
                ...(placement === "bottom" ? { top: -6, borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)" } : {}),
                ...(placement === "left" || placement === "right" ? { top: arrow.top } : {}),
              }}
            />
          )}

          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Step {i + 1} of {steps.length}
          </p>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, n) => (
                <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-4 bg-primary" : "w-1.5 bg-border"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <button type="button" onClick={back} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {i === steps.length - 1 ? "Get started" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
