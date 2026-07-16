// Seed a realistic psychoeducational evaluation (a class owned by the psych test
// account: one student, standard categories + subtests + a comparison snapshot)
// for local development and demos.
//   npx tsx scripts/psych-seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const EMAIL = "wisegraph.psych.test@gmail.com";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), log: ["error"] });

const CATS: { name: string; subs: string[]; catScore: number; subScores: number[] }[] = [
  { name: "Reading", subs: ["Decoding", "Fluency", "Comprehension"], catScore: 112, subScores: [118, 110, 109] },
  { name: "Writing", subs: ["Spelling", "Composition"], catScore: 96, subScores: [91, 101] },
  { name: "Mathematics", subs: ["Arithmetic", "Problem solving", "Pattern recognition"], catScore: 121, subScores: [124, 115, 123] },
  { name: "Science", subs: ["Inquiry", "Concepts", "Data"], catScore: 105, subScores: [108, 99, 107] },
];

async function main() {
  const teacher = await prisma.teacher.findFirst({ where: { email: EMAIL } });
  if (!teacher) throw new Error(`No psych account for ${EMAIL} — run scripts/psych-setup.mjs first.`);

  // idempotent wipe of this account's evaluations
  const old = await prisma.class.findMany({ where: { teacherId: teacher.id } });
  for (const c of old) {
    await prisma.snapshotScore.deleteMany({ where: { snapshot: { classId: c.id } } });
    await prisma.scoreSnapshot.deleteMany({ where: { classId: c.id } });
    await prisma.score.deleteMany({ where: { student: { classId: c.id } } });
    await prisma.subcategory.deleteMany({ where: { category: { classId: c.id } } });
    await prisma.student.deleteMany({ where: { classId: c.id } });
    await prisma.category.deleteMany({ where: { classId: c.id } });
  }
  await prisma.class.deleteMany({ where: { teacherId: teacher.id } });

  const evaluation = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      name: "Jordan Vega",
      gradeLevel: "5",
      subject: "Psychoeducational Evaluation",
      term: null,
    },
  });

  const cats: { id: string; name: string; subs: { id: string; name: string }[] }[] = [];
  for (const [i, c] of CATS.entries()) {
    const cat = await prisma.category.create({ data: { classId: evaluation.id, name: c.name, order: i } });
    const subs = [];
    for (const [j, s] of c.subs.entries()) {
      subs.push(await prisma.subcategory.create({ data: { categoryId: cat.id, name: s, order: j } }));
    }
    cats.push({ id: cat.id, name: c.name, subs });
  }

  const student = await prisma.student.create({
    data: {
      classId: evaluation.id,
      name: "Jordan Vega",
      studentCode: "EVAL-01",
      gradeLevel: "5",
      overallScore: 108,
    },
  });

  for (const [i, cat] of cats.entries()) {
    await prisma.score.create({
      data: { studentId: student.id, categoryId: cat.id, standardScore: CATS[i].catScore },
    });
    for (const [j, sub] of cat.subs.entries()) {
      await prisma.score.create({
        data: {
          studentId: student.id,
          categoryId: cat.id,
          subcategoryId: sub.id,
          standardScore: CATS[i].subScores[j],
        },
      });
    }
  }

  // comparison snapshot (~7 lower) so the compare-over-time overlay has data
  const snap = await prisma.scoreSnapshot.create({
    data: {
      name: "Initial evaluation",
      classId: evaluation.id,
      teacherId: teacher.id,
      snapshotDate: new Date("2026-01-15T12:00:00Z"),
    },
  });
  const enrolled = await prisma.student.findMany({
    where: { classId: evaluation.id },
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
          standardScore: Math.max(60, sc.standardScore - 7),
          overallScore: 101,
        },
      });
    }
  }

  console.log(`seeded psych evaluation ${evaluation.id} (Jordan Vega, ${CATS.length} categories, 1 snapshot)`);
  console.log(`URL: /psych/evaluations/${evaluation.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
