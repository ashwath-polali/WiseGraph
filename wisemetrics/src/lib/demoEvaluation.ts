import type { ClassScoreSummary, CategoryScore, StudentScoreSummary } from "@/types/scores";

/**
 * A believable demo evaluation for the marketing landing page, shaped exactly
 * like a real ClassScoreSummary so the actual premium instruments render it with
 * no API calls. Realistic psychoeducational domains + subtests, non-round scores,
 * and a small class so both single-student and class-level treatments have data.
 */

type DemoCat = { id: string; name: string; subs: { id: string; name: string; score: number }[] };

// the focus student — the one the hero centers on
const FOCUS: DemoCat[] = [
  {
    id: "verbal",
    name: "Verbal Comprehension",
    subs: [
      { id: "vocab", name: "Vocabulary", score: 118 },
      { id: "similar", name: "Similarities", score: 112 },
      { id: "info", name: "Information", score: 121 },
    ],
  },
  {
    id: "visual",
    name: "Visual Spatial",
    subs: [
      { id: "block", name: "Block Design", score: 104 },
      { id: "puzzle", name: "Visual Puzzles", score: 99 },
    ],
  },
  {
    id: "fluid",
    name: "Fluid Reasoning",
    subs: [
      { id: "matrix", name: "Matrix Reasoning", score: 127 },
      { id: "weights", name: "Figure Weights", score: 123 },
    ],
  },
  {
    id: "working",
    name: "Working Memory",
    subs: [
      { id: "digit", name: "Digit Span", score: 91 },
      { id: "picture", name: "Picture Span", score: 96 },
    ],
  },
  {
    id: "speed",
    name: "Processing Speed",
    subs: [
      { id: "coding", name: "Coding", score: 88 },
      { id: "symbol", name: "Symbol Search", score: 94 },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    subs: [
      { id: "decode", name: "Decoding", score: 109 },
      { id: "fluency", name: "Fluency", score: 103 },
      { id: "comp", name: "Comprehension", score: 114 },
    ],
  },
];

const avg = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
const clamp = (n: number) => Math.max(62, Math.min(148, n));

function toCategories(cats: DemoCat[]): CategoryScore[] {
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    score: avg(c.subs.map((s) => s.score)),
    subcategories: c.subs.map((s) => ({ id: s.id, name: s.name, score: s.score })),
  }));
}

// deterministic per-student jitter so classmates vary without Math.random at render
function shift(cats: DemoCat[], seed: number): DemoCat[] {
  return cats.map((c, ci) =>
    ({
      ...c,
      subs: c.subs.map((s, si) => {
        const h = Math.sin(seed * 12.9898 + ci * 3.71 + si * 7.13) * 43758.5453;
        const delta = Math.round(((h - Math.floor(h)) * 2 - 1) * 14);
        return { ...s, score: clamp(s.score + delta) };
      }),
    }),
  );
}

const CLASSMATES = [
  "Elena Ruiz",
  "Marcus Bell",
  "Priya Nair",
  "Theo Anderson",
  "Lucia Romano",
  "Devon Clarke",
  "Amara Osei",
];

function makeStudent(id: string, name: string, gradeLevel: string, cats: DemoCat[]): StudentScoreSummary {
  const categories = toCategories(cats);
  return {
    id,
    name,
    gradeLevel,
    overallScore: avg(categories.map((c) => c.score)),
    categories,
  };
}

const focusStudent = makeStudent("demo-maya", "Maya Chen", "4", FOCUS);
const classmates = CLASSMATES.map((name, i) => makeStudent(`demo-${i}`, name, "4", shift(FOCUS, i + 1)));

export const DEMO_EVALUATION: ClassScoreSummary = {
  id: "demo-eval",
  name: "Maya Chen",
  gradeLevel: "4",
  subject: "Psychoeducational Evaluation",
  term: null,
  categories: focusStudent.categories,
  students: [focusStudent, ...classmates],
};

export const DEMO_FOCUS = focusStudent;
export const DEMO_CLASS = [focusStudent, ...classmates];
