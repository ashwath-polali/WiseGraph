// prisma/seed.ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const reading = await prisma.category.create({
    data: { classId: cls.id, name: "Reading", order: 0 },
  });

  const writing = await prisma.category.create({
    data: { classId: cls.id, name: "Writing", order: 1 },
  });

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
