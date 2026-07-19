import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prisma = createPrismaClient();

async function main() {

  const teacher = await prisma.teacher.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      email: "teacher@example.com",
      name: "Mr. Wiseman",
    },
  });

  const cls = await prisma.class.create({
    data: {
      teacherId: teacher.id,
      name: "Period 1 Reading",
      gradeLevel: "7",
      subject: "Reading",
      term: "Fall 2025",
    },
  });

  await prisma.category.createMany({
    data: [
      { classId: cls.id, name: "Reading",       order: 0 },
      { classId: cls.id, name: "Writing",       order: 1 },
      { classId: cls.id, name: "Vocabulary",    order: 2 },
      { classId: cls.id, name: "Comprehension", order: 3 },
      { classId: cls.id, name: "Fluency",       order: 4 },
    ],
  });

  const categories = await prisma.category.findMany({
    where: { classId: cls.id },
    orderBy: { order: "asc" },
  });

  const [reading, writing, vocab, comp, fluency] = categories;

  const student = await prisma.student.create({
    data: {
      classId: cls.id,
      name: "Alex Rivera",
      studentCode: "S001",
      gradeLevel: "7",
      overallScore: 108,
    },
  });


  await prisma.score.createMany({
    data: [
      {
        studentId: student.id,
        categoryId: reading.id,
        standardScore: 112,
      },
      {
        studentId: student.id,
        categoryId: writing.id,
        standardScore: 98,
      },
      {
        studentId: student.id,
        categoryId: vocab.id,
        standardScore: 105,
      },
      {
        studentId: student.id,
        categoryId: comp.id,
        standardScore: 115,
      },
      {
        studentId: student.id,
        categoryId: fluency.id,
        standardScore: 102,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
