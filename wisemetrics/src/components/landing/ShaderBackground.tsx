"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MeshGradient } from "@paper-design/shaders-react";

// Subtle, brand-adjacent color spots (not rainbow). Paper + soft indigo + moss.
const LIGHT = ["#f5f3ed", "#e7e2f4", "#e0ece5", "#efe9f6", "#f3ede6"];
const DARK = ["#181510", "#231e33", "#1b2a23", "#241a30", "#1e1a16"];

/**
 * A live WebGL mesh-gradient backdrop (the Linear-style flowing color field),
 * built to never break the page:
 *  - a static CSS gradient sits underneath and always renders;
 *  - the shader only mounts client-side, when WebGL is available, and when the
 *    user hasn't asked for reduced motion;
 *  - it's fixed behind everything and ignores pointer events.
 */
export function ShaderBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const c = document.createElement("canvas");
      setWebgl(Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const dark = resolvedTheme === "dark";
  const colors = dark ? DARK : LIGHT;
  const fallback = dark
    ? "radial-gradient(70% 60% at 28% -5%, #231e33, transparent 62%), radial-gradient(60% 55% at 96% 12%, #1b2a23, transparent 60%), var(--background)"
    : "radial-gradient(72% 62% at 24% -6%, #e7e2f4, transparent 62%), radial-gradient(60% 55% at 98% 10%, #e0ece5, transparent 60%), var(--background)";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* always-present static fallback */}
      <div className="absolute inset-0" style={{ background: fallback }} />

      {mounted && webgl && !reduced && (
        <MeshGradient
          colors={colors}
          speed={0.22}
          distortion={0.85}
          swirl={0.1}
          grainOverlay={0.04}
          maxPixelCount={2073600}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: dark ? 0.92 : 0.72,
          }}
        />
      )}
    </div>
  );
}
