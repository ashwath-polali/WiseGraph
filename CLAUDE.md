# WiseGraph

Radial/polar assessment-visualization app for Mr. Wiseman (BLHS school psychologist) to show parents standardized scores. Two portals: **teacher** (classes → students → categories/subcategories → scores) and **psychologist** (evaluations → subtests). Deadline: must be polished and deployed before fall 2026 parent-conference season.

App lives in `wisemetrics/`. Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + Prisma 7 + Supabase (Postgres + Auth).

## Iron rule

The app is being redesigned from "functional but ugly" to premium. **Functionality is frozen** — every feature must survive identically: 3 chart types (polar/exploding radial/bell curve) with view toggle, snapshot save + comparison overlay, score scale 60–150, universal category template sync, PNG/PDF export, dual-account routing (`+psych@` email aliasing), settings/defaults. If a redesign step would change behavior, stop and ask.

## Design toolkit (installed, use it)

Skills in `.claude/skills/` — invoke the right one per surface:
- **redesign-existing-projects** — primary skill for upgrading app/dashboard screens. Audit-first, never rewrites functionality.
- **design-taste-frontend** — landing page (`/`) only. It says so itself: not for dashboards or data tables.
- **animate** — any motion work (Emil Kowalski course distillation: <300ms UI animations, custom easing, ease-out for enters, no ease-in).
- **web-design-guidelines** — run as an audit pass after visual changes.
- **ui-ux-pro-max** — design-system generation/lookup only (styles, palettes, font pairings); don't keep it in the loop for routine edits.
- **frontend-design** (Anthropic, ships with CC) — aesthetic direction baseline.

MCP servers in `.mcp.json`: **playwright** (screenshot-iterate every visual change — this is mandatory, not optional), **shadcn** (component registry), **context7** (live Tailwind v4/Next 16 docs).

Libraries installed: `motion` (all animation), `d3-scale`/`d3-shape` (chart math for the SVG chart rebuild), shadcn/ui (+ Base UI primitives), `sonner` (toasts), `vaul` (drawers), `html-to-image` (export capture). Landing-page flair (React Bits SplashCursor, Aceternity, Magic UI) gets pulled per-component via registries when the landing page is built — dashboard gets craft, not particles.

## Visual iteration loop

1. Make the change. 2. `npm run dev` in `wisemetrics/`, screenshot with Playwright MCP. 3. Compare against intent, fix, repeat. Never declare a visual change done without having seen it.

## Known gotchas

- **Export**: `html2canvas` cannot parse `oklch()` colors (Tailwind v4 emits them) — this caused the old "export darkening" bug. Export rework must use `html-to-image` or keep rgb fallbacks on captured nodes.
- shadcn's Button replaced the old hand-rolled one; old `variant="primary"` is now `variant="default"`.
- Old `globals.css` forced `font-family: Arial` on body while loading Geist — the pre-redesign app rendered in Arial. Kept for now; kill it in the token pass.
- `.env` contains the live Supabase DB password (pre-existing). Do not commit new secrets; rotation is on the backlog.
- Charts are 4 monolith components (~4,700 lines total) in `wisemetrics/src/components/` — rebuild them as small SVG components with d3 math + motion, don't patch them.

## Cortex

Project memory cluster: `projects/wisegraph.md` (sections: status, origin, framing, redesign). Read it at session start; log redesign milestones to `## redesign`.
