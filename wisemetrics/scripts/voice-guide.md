# WiseGraph — Copy Voice Guide (humanize every user-facing string)

You are rewriting the **visible copy** of a WiseGraph surface so it reads like a
real person wrote it — not template/AI marketing filler. WiseGraph is an
assessment-visualization app used by school psychologists and teachers to show
standardized scores to parents. The landing page already sets the voice; match
it.

## The voice
Warm, plain, direct, quietly confident, a touch dry. Written for busy educators
who know their students by name. Never salesy, never loud, never cute.

Anchor examples (already shipped on the landing — match this register):
- "A student's whole story, in one honest picture."
- "Follow a score to its roots."
- "Charts that survive a projector."
- "Stop squinting at spreadsheets."
- "An overall number never tells you why."

## Rules
- **Sentence case** for headings and buttons ("Add student", not "Add Student").
- **Active voice, present tense.** "We couldn't save that." not "Changes were not saved."
- **Specific over generic.** Name the real thing: scores, categories, subskills,
  the roster, a snapshot, a conference, an IEP meeting — not "data", "insights",
  "items", "content".
- **Confident, not loud.** No exclamation marks in success messages. "Saved." not "Saved!".
- **Errors are calm and useful.** "That email's already in use — try logging in."
  Never "Oops!", never "Something went wrong!" with no next step.
- **Empty states invite the next action.** "No students yet. Add your first from
  the roster." not "No data available."
- **Cut filler.** Delete "simply", "just", "easily", "powerful", "seamless".
- **BANNED words/phrases:** Elevate, Seamless(ly), Unleash, Next-Gen, Game-changer,
  Leverage, Delve, Tapestry, Robust, Effortless(ly), Empower, Streamline, Cutting-edge,
  "In the world of…", "Take it to the next level", "raw data into clean visuals".

## What to rewrite (VISIBLE text only)
Headings, subtitles, descriptions, helper text, field **label text**, input
**placeholders**, button labels, empty-state copy, error/success/toast messages,
chart hint text ("Hover a wedge to see…"), confirmation prompts.

## Stay true — don't invent
Only describe what WiseGraph actually does: classes → students → categories →
subskills; scores on a 60–150 scale (100 = average); radial, bell-curve, and
concentric chart views; snapshots + single-student comparison; PNG/PDF export;
a universal category template that syncs across classes; separate teacher and
school-psychologist portals. Do not promise analytics, AI, integrations,
collaboration, or anything not listed.

## FREEZE (never change — behavior must be identical)
- Form field `name`/`id`/`value` attributes, state, props, handlers, hrefs,
  imports, conditionals, data flow, `key`s.
- Numbers/scores/dates that are DATA (only change surrounding words).
- The literal `+psych@` email-alias logic and any validation thresholds.
- Do not add or remove features, inputs, or buttons — only reword existing text.
- Keep aria-labels accurate to the control they describe (you may make them more
  natural, but they must still correctly name the control).

Edit strings in place with Edit. Do not run the build. Only touch files in your
assigned list.
