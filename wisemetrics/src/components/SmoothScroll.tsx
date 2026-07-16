"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * App-wide smooth scroll (the Apple/Linear inertia feel), wired to GSAP so
 * ScrollTrigger pins stay glued to Lenis's virtual scroll instead of drifting:
 *  - Lenis runs on the GSAP ticker (one shared clock);
 *  - every Lenis scroll ticks ScrollTrigger.update;
 *  - triggers refresh after fonts load and on resize.
 * Nested scroll areas opt out with data-lenis-prevent. Disabled (native scroll,
 * triggers still work) when the user prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const refresh = () => ScrollTrigger.refresh();
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("resize", refresh);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => window.removeEventListener("resize", refresh);
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      window.removeEventListener("resize", refresh);
    };
  }, []);

  return null;
}
