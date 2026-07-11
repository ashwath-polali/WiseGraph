# WiseGraph — Redesign Sweep Contract (READ FULLY BEFORE EDITING)

You are converting one cluster of the WiseGraph app from its **old dark-first,
hardcoded-color UI** to the shipped **"clinical-editorial" light-first token
system**. The app defaults to LIGHT. The old files use `bg-slate-*`,
`text-white`, `text-slate-400`, hardcoded hex, `bg-sky-*` etc. — these look
fine in dark mode but are BROKEN in light mode (dark slabs on cream paper,
invisible light-on-light text). Your job is to make every surface render
correctly and premium in BOTH modes by using semantic tokens only.

## THE IRON RULE (non-negotiable)
Functionality is FROZEN. You may ONLY change styling (className strings, inline
style colors, wrapper markup for layout/motion). You must NOT change:
- component logic, state, effects, event handlers, data fetching, props/APIs
- conditional rendering behavior, form field names, validation, routing
- what features exist or how they work (snapshot save/compare, export, drill-down,
  sync, add/edit/delete, toggles — all must survive identically)
If a restyle would require a logic change, keep the logic and restyle around it.
Never delete a feature to make it look cleaner.

## Token vocabulary (from globals.css — these adapt to light & dark automatically)
Surfaces:  `bg-background` (page), `bg-card` (panels/cards), `bg-muted` (subtle fills),
           `bg-secondary`, `bg-accent` (tinted indigo hover), `bg-popover`
Text:      `text-foreground` (primary ink), `text-muted-foreground` (secondary),
           `text-card-foreground`, `text-primary` (indigo link/accent)
Lines:     `border-border` (hairline), `border-input`, `divide-border`, `ring-ring`
Accent:    `bg-primary text-primary-foreground` (indigo 285), `text-primary`
Role:      `text-psych` / `bg-psych` (moss green — psychologist role only)
Danger:    `text-destructive`, `bg-destructive/10` (clay red)
Charts/score series (use the SAME semantics as the class charts):
           `--chart-1` indigo (category/class default), `--chart-2` moss/green,
           `--chart-3` ochre, `--chart-4` terracotta = THE STUDENT series,
           `--chart-5` slate-blue, `--chart-6` violet = subskill.
           In SVG use `var(--chart-4)` for the student's own line/marks,
           `var(--muted-foreground)` for the class-average reference line.
Radii:     `rounded-lg`/`rounded-xl` containers, `rounded-md` inner.
Fonts:     display headers → `font-display` (Fraunces). Data/numbers →
           `font-mono` + `data-numeric` (tabular). Body inherits Instrument Sans.

## Direct mapping (old → new) — apply these substitutions
- `bg-slate-900` / `bg-slate-950` / `bg-black` / `bg-[#0...]`  → `bg-card` (a panel) or `bg-background` (page)
- `bg-slate-800` / `bg-slate-700` / `bg-gray-800`              → `bg-card` (raised panel) or `bg-muted` (subtle fill)
- `bg-slate-100/200` (light fills)                            → `bg-muted` or `bg-secondary`
- `text-white` / `text-slate-50/100`                          → `text-foreground`
- `text-slate-300/400/500` / `text-gray-400`                  → `text-muted-foreground`
- `text-slate-600/700/900` (already dark)                     → `text-foreground` (or `-muted-foreground` if secondary)
- `border-slate-700/800` / `border-white/10`                  → `border-border`
- `bg-sky-*` / `text-sky-*` / stroke `#38bdf8` / cyan/blue chart accents → student series `--chart-4` terracotta (or `text-primary` for links)
- `bg-emerald-*`/green deltas                                 → keep positive-delta green via `text-[color:var(--chart-2)]` or `text-psych`
- hardcoded `#xxxxxx` in SVG stroke/fill                      → nearest token via `var(--chart-N)` / `var(--foreground)` / `var(--muted-foreground)` / `var(--border)`
- raw `<button className="bg-indigo-600 ...">`                → use the `Button` primitive: `import { Button } from "@/components/ui/Button"` (variants: default=indigo, outline, secondary, ghost, destructive, link; sizes: xs/sm/default/lg/icon*)
- raw card `<div className="rounded-... bg-slate-800 border ...">` → use `Card` primitive: `import { Card } from "@/components/ui/Card"`
Prefer the `Button` and `Card` primitives wherever a raw button/panel exists.

## Redesign polish (apply after tokenizing — priority 2)
- Hierarchy: section titles small + semibold `text-sm font-semibold text-foreground`;
  supporting copy `text-xs/sm text-muted-foreground`. Big page titles → `font-display`.
- Spacing: let it breathe — consistent px-5/py-4 headers, gap-based grids, no cramped rows.
- States: every interactive element needs hover + focus-visible + active feedback.
  Buttons already have it via the primitive. Rows: `hover:bg-accent/40 transition-colors duration-150`.
- Inputs: `bg-card border-input rounded-md focus-visible:ring-2 focus-visible:ring-ring`.
- Numbers/scores: `font-mono` + `data-numeric`, often in a `rounded-md border bg-muted/60 px-2 py-0.5` chip.
- Remove sudden dark sections in the light page — no dark slabs.

## Tasteful motion (priority 3 — only where zero behavior risk)
Import from `motion/react`. Rules (Emil Kowalski): UI animations < 300ms, ease-OUT
for enters (never ease-in), spring for interactive/physical feedback.
- Lists/cards/rows: stagger-in — `initial={{opacity:0, y:6}} animate={{opacity:1, y:0}}`
  with `transition={{ duration: 0.2, ease: [0.22,1,0.36,1], delay: i*0.03 }}`.
- Toggles/segmented controls: sliding `layoutId` pill (see ClassOverviewClient for the pattern).
- Hover lifts: `whileHover={{ y: -1 }}` spring `{ type:"spring", stiffness:400, damping:30 }`.
- Panels/detail reveals: `AnimatePresence` fade+slide, `duration: 0.15`.
- Do NOT animate `top/left/width/height`; use `transform`/`opacity` only.
- Do NOT wrap a native form control in a way that breaks its events.

## Canonical examples already on-system (mimic these)
- `app/(dashboard)/dashboard/page.tsx` — tokened page, Card usage, roster rows.
- `src/components/ClassOverviewClient.tsx` — segmented toggle with motion layoutId pill.
- `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx` — the primitives.

## Output discipline
Edit the files in place with the Edit/Write tools. Keep every `"use client"`,
import, and export intact. Do not run the build (a single build runs later).
When done, report exactly which files you changed and confirm behavior was frozen.
