// Phase 2 demo seed — fills the Playwright test account with realistic data
// so charts and dashboards have real bones during the redesign.
// Run: npx tsx scripts/seed-demo.ts   (or ts-node; uses .env DATABASE_URL)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_EMAIL = "wisegraph.phase2.test@gmail.com";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), log: ["error"] });

// Deterministic RNG so reseeding gives identical data.
let rngState = 20260710;
function rng() {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
}
// Approx normal via sum of uniforms, clamped to the app's 60–150 scale.
function score(mean: number, sd: number) {
  const n = (rng() + rng() + rng() + rng() - 2) * Math.sqrt(3); // ~N(0,1)
  return Math.max(60, Math.min(150, Math.round(mean + n * sd)));
}

const CATEGORIES: Array<{ name: string; subs: string[] }> = [
  { name: "Reading comprehension", subs: ["Literal recall", "Inference", "Main idea"] },
  { name: "Written expression", subs: ["Organization", "Grammar & mechanics", "Sentence fluency"] },
  { name: "Vocabulary", subs: ["Context clues", "Academic terms"] },
  { name: "Oral reading fluency", subs: ["Accuracy", "Rate", "Prosody"] },
];

const ROSTER = [
  "Maya Okafor", "Julian Reyes", "Harper Lindqvist", "DeShawn Mitchell",
  "Priya Raghavan", "Cole Bratton", "Sofia Marchetti", "Ethan Nakamura",
  "Amara Diallo", "Tyler Voss", "Isabela Fuentes", "Noah Kirchner",
  "Zoe Pemberton", "Marcus Hale",
];

async function main() {
  const teacher = await prisma.teacher.findFirst({ where: { email: TEST_EMAIL } });
  if (!teacher) throw new Error(`No teacher row for ${TEST_EMAIL} — sign up first.`);

  // Wipe prior demo data for idempotence.
  const oldClasses = await prisma.class.findMany({ where: { teacherId: teacher.id } });
  for (const c of oldClasses) {
    await prisma.snapshotScore.deleteMany({ where: { snapshot: { classId: c.id } } });
    await prisma.scoreSnapshot.deleteMany({ where: { classId: c.id } });
    await prisma.score.deleteMany({ where: { student: { classId: c.id } } });
    await prisma.subcategory.deleteMany({ where: { category: { classId: c.id } } });
    await prisma.student.deleteMany({ where: { classId: c.id } });
    await prisma.category.deleteMany({ where: { classId: c.id } });
  }
  await prisma.class.deleteMany({ where: { teacherId: teacher.id } });

  for (const [ci, clsSpec] of [
    { name: "Period 3 — English 9", grade: "9", subject: "English", term: "Fall 2026" },
    { name: "Period 5 — English 9", grade: "9", subject: "English", term: "Fall 2026" },
  ].entries()) {
    const cls = await prisma.class.create({
      data: {
        teacherId: teacher.id,
        name: clsSpec.name,
        gradeLevel: clsSpec.grade,
        subject: clsSpec.subject,
        term: clsSpec.term,
      },
    });

    const cats: { id: string; name: string; subs: { id: string; name: string }[] }[] = [];
    for (const [i, c] of CATEGORIES.entries()) {
      const cat = await prisma.category.create({
        data: { classId: cls.id, name: c.name, order: i },
      });
      const subs = [];
      for (const [j, s] of c.subs.entries()) {
        subs.push(await prisma.subcategory.create({
          data: { categoryId: cat.id, name: s, order: j },
        }));
      }
      cats.push({ id: cat.id, name: c.name, subs });
    }

    // Slightly different class profiles so the two classes compare interestingly.
    const classMean = ci === 0 ? 102 : 96;

    const students = ROSTER.slice(0, ci === 0 ? 14 : 12);
    for (const [si, name] of students.entries()) {
      const ability = score(classMean, 12); // student-level center
      const student = await prisma.student.create({
        data: {
          classId: cls.id,
          name,
          studentCode: `P${ci === 0 ? 3 : 5}-${String(si + 1).padStart(2, "0")}`,
          gradeLevel: clsSpec.grade,
          overallScore: ability,
        },
      });

      for (const cat of cats) {
        const catScore = score(ability, 7);
        await prisma.score.create({
          data: { studentId: student.id, categoryId: cat.id, standardScore: catScore },
        });
        for (const sub of cat.subs) {
          await prisma.score.create({
            data: {
              studentId: student.id,
              categoryId: cat.id,
              subcategoryId: sub.id,
              standardScore: score(catScore, 5),
            },
          });
        }
      }
    }

    // A fall-benchmark snapshot ~6 points lower on average, for comparison overlays.
    const snap = await prisma.scoreSnapshot.create({
      data: {
        name: "September benchmark",
        classId: cls.id,
        teacherId: teacher.id,
        snapshotDate: new Date("2026-09-14T12:00:00Z"),
      },
    });
    const enrolled = await prisma.student.findMany({
      where: { classId: cls.id },
      include: { scores: true },
    });
    for (const st of enrolled) {
      for (const sc of st.scores) {
        const cat = cats.find((c) => c.id === sc.categoryId);
        const sub = cat?.subs.find((s) => s.id === sc.subcategoryId);
        await prisma.snapshotScore.create({
          data: {
            snapshotId: snap.id,
            studentId: st.id,
            studentName: st.name,
            categoryId: sc.categoryId,
            categoryName: cat?.name ?? "",
            subcategoryId: sc.subcategoryId,
            subcategoryName: sub?.name ?? null,
            standardScore: Math.max(60, sc.standardScore - 4 - Math.round(rng() * 6)),
            overallScore: st.overallScore ?? 100,
          },
        });
      }
    }
    console.log(`seeded ${clsSpec.name}: ${students.length} students, 4 categories, 1 snapshot`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
