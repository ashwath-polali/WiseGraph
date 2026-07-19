# WiseGraph

WiseGraph turns standardized test scores into charts a teacher or school psychologist can read at a glance and share with a parent in a conference.

It has two modes:

- **Psychologist.** Build an evaluation for a student, score each assessment area and its subtests, and walk through the results on one radial chart or a bell curve.
- **Teacher.** Track a whole class, open any student to see their profile against the class average, and manage the roster and the assessment setup.

Scores use the standard-score scale (mean 100, standard deviation 15, shown from 60 to 150), so the charts sit directly on the normal distribution. Every view shades the average range, 85 to 115.

## What it does

- Radial and bell-curve charts that draw themselves on load and open each area up as you scroll.
- Drill into a domain to read its subtests, percentile, and classification band.
- Compare a student to a saved snapshot from last year, or to the class average.
- Export any chart as a PNG or PDF, clean enough to project or hand across a table.
- A short first-run tour for each mode, with a replay in settings.
- Light and dark themes.

## Built with

- Next.js (App Router) and React
- Tailwind CSS v4
- Prisma with a Postgres database on Supabase, which also handles auth
- Inline SVG charts using d3-scale and d3-shape, animated with Motion and GSAP

## Getting started

Install dependencies:

```bash
npm install
```

Add a `.env` file with your database connection string:

```
DATABASE_URL=postgresql://...
```

Generate the Prisma client, then start the dev server:

```bash
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Keeping the database awake

Supabase's free tier pauses a project after about a week with no activity. A Vercel Cron (defined in `vercel.json`) calls `/api/keep-alive` once a day to run a small query, which keeps the project from pausing. You can run the same check yourself with `node scripts/keep-alive.mjs`.

## Deploying

The app runs on Vercel. Set `DATABASE_URL` in the project's environment variables, and the daily cron is picked up from `vercel.json` on each production deploy.
