import type { TourStep } from "@/components/OnboardingTour";

/**
 * First-run tours. Written in plain language for a psychologist or teacher, no
 * jargon. Steps with a `target` spotlight a real element when it's on the page,
 * and fall back to a centered card when it isn't (e.g. a brand-new, empty
 * dashboard), so the flow reads well either way.
 */

export const PSYCH_TOUR: TourStep[] = [
  {
    title: "Welcome to WiseGraph",
    body: "This is where you turn a student's standardized scores into one clear picture you can show a parent. Here's a quick tour, and you can skip it any time.",
  },
  {
    title: "Start an evaluation",
    body: "Create an evaluation for a student here. You add their name, grade, and the areas you want to score.",
    target: '[data-tour="psych-new"]',
    placement: "bottom",
  },
  {
    title: "Set your areas once",
    body: "Set up your assessment categories here. Every new evaluation reuses the same set, so scores always line up the same way.",
    target: '[data-tour="psych-categories"]',
    placement: "bottom",
  },
  {
    title: "Your evaluations live here",
    body: "Each student you evaluate becomes a card. Open one to see the full chart and every score behind it.",
    target: '[data-tour="psych-evals"]',
    placement: "top",
  },
  {
    title: "One chart, every score",
    body: "Inside an evaluation, the chart shows every area on one radial. As you scroll, each area opens up and shows the subtests underneath in plain numbers.",
  },
  {
    title: "Compare and export",
    body: "Save a snapshot to lay this year over last year, and export a clean chart as a PDF or image to hand across the table or project on a wall.",
  },
  {
    title: "You're all set",
    body: "That's the whole app. Start a new evaluation whenever you're ready.",
  },
];

export const TEACHER_TOUR: TourStep[] = [
  {
    title: "Welcome to WiseGraph",
    body: "This is where you track a whole class and each student, and see where everyone stands at a glance. Here's a quick tour, and you can skip it any time.",
  },
  {
    title: "Create a class",
    body: "Start by making a class and adding your roster of students here.",
    target: '[data-tour="teacher-new"]',
    placement: "bottom",
  },
  {
    title: "Set your areas once",
    body: "Set up the categories and subskills you'll score. Every student in the class uses the same set.",
    target: '[data-tour="teacher-configure"]',
    placement: "bottom",
  },
  {
    title: "Your class at a glance",
    body: "This chart is the class average across every area. You can switch it to a bell curve, or compare, whenever you like.",
    target: '[data-tour="teacher-overview"]',
    placement: "right",
  },
  {
    title: "Every student, right here",
    body: "Each student shows their overall score. Open one to see their charts, with the class average drawn right alongside.",
    target: '[data-tour="teacher-roster"]',
    placement: "left",
  },
  {
    title: "One picture, against the class",
    body: "Inside a student, scroll and each area opens up to show their score, the class average, and every subtest. Export a clean chart for a meeting.",
  },
  {
    title: "You're all set",
    body: "That's the whole app. Create a class whenever you're ready.",
  },
];
