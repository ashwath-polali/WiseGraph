"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { polarScoreToRadius, polarCatAngles, polarPointAt, domainColor } from "@/lib/instrumentGeometry";
import { DEMO_CLASS } from "@/lib/demoEvaluation";
import type { StudentScoreSummary } from "@/types/scores";

const ENTER = [0.22, 1, 0.36, 1] as const;

/** a small radial profile from the polar's OWN math, so a node matches the hero by construction. */
function MiniRadial({ student }: { student: StudentScoreSummary }) {
  const cats = student.categories;
  const count = cats.length;
  const pts = cats.map((c, i) => polarPointAt(polarScoreToRadius(c.score), polarCatAngles(i, count).mid));
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 600 600" className="h-full w-full overflow-visible">
      <circle cx={300} cy={300} r={polarScoreToRadius(150)} fill="none" stroke="var(--border)" strokeWidth={2} opacity={0.5} />
      <circle cx={300} cy={300} r={polarScoreToRadius(100)} fill="none" stroke="var(--border)" strokeWidth={1.4} strokeDasharray="4 10" opacity={0.45} />
      <polygon points={poly} fill="var(--chart-2)" fillOpacity={0.12} stroke="var(--chart-2)" strokeWidth={2.4} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={cats[i].id} cx={p.x} cy={p.y} r={8} fill={domainColor(i)} stroke="var(--card)" strokeWidth={2} />
      ))}
      <circle cx={300} cy={300} r={30} fill="var(--card)" stroke="var(--border)" strokeWidth={2} />
      <text x={300} y={300} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={40} fontWeight={600} fill="var(--foreground)">
        {student.overallScore}
      </text>
    </svg>
  );
}

const LAYOUT = [
  { x: 10, y: 16, size: 168, depth: 1 },
  { x: 66, y: 8, size: 118, depth: 0.72 },
  { x: 40, y: 46, size: 138, depth: 0.86 },
  { x: 85, y: 52, size: 98, depth: 0.5 },
  { x: 20, y: 64, size: 108, depth: 0.58 },
  { x: 57, y: 72, size: 92, depth: 0.42 },
  { x: 90, y: 26, size: 82, depth: 0.36 },
  { x: 2, y: 44, size: 96, depth: 0.46 },
];

function Glyph({
  student,
  spec,
  mx,
  my,
}: {
  student: StudentScoreSummary;
  spec: (typeof LAYOUT)[number];
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const x = useTransform(mx, (v) => v * spec.depth * 46);
  const y = useTransform(my, (v) => v * spec.depth * 46);
  return (
    <motion.div
      style={{
        x,
        y,
        left: `${spec.x}%`,
        top: `${spec.y}%`,
        width: spec.size,
        height: spec.size,
        opacity: 0.4 + spec.depth * 0.55,
        filter: spec.depth < 0.62 ? `blur(${((0.62 - spec.depth) * 4).toFixed(1)}px)` : "none",
        zIndex: Math.round(spec.depth * 10),
      }}
      className="absolute"
      animate={{ y: [0, spec.depth * -6, 0] }}
      transition={{ duration: 6 + spec.depth * 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <MiniRadial student={student} />
    </motion.div>
  );
}

export function ConstellationPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.6 });

  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-28">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: ENTER }}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Chapter V · The class
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: ENTER, delay: 0.05 }}
            className="mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-medium leading-[1.08] tracking-[-0.02em] text-balance"
          >
            From the whole class down to a single subskill.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: ENTER, delay: 0.12 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            <p>Every student is one figure. A class is a field of them, each its own shape.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-muted-foreground/60">01</span>
                <span><span className="text-foreground">Teachers</span> track a class across categories and subskills over a term.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-muted-foreground/60">02</span>
                <span><span className="text-foreground">School psychologists</span> build one evaluation per student, ready for the conference.</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* depth field */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: ENTER }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            rawX.set((e.clientX - r.left) / r.width - 0.5);
            rawY.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onMouseLeave={() => {
            rawX.set(0);
            rawY.set(0);
          }}
          className="relative hidden h-[520px] lg:block"
        >
          {LAYOUT.map((spec, i) => (
            <Glyph key={DEMO_CLASS[i]?.id ?? i} student={DEMO_CLASS[i % DEMO_CLASS.length]} spec={spec} mx={mx} my={my} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
