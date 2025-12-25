// app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create student
export async function POST(req: Request) {
  const body = await req.json();
  const { classId, name, gradeLevel, overallScore } = body ?? {};

  if (!classId || !name || !gradeLevel) {
    return NextResponse.json(
      { error: "classId, name, and gradeLevel are required" },
      { status: 400 }
    );
  }

  const clampedScore =
    typeof overallScore === "number"
      ? Math.max(60, Math.min(150, overallScore))
      : 100;

  const student = await prisma.student.create({
    data: {
      classId,
      name,
      gradeLevel,
      overallScore: clampedScore,
    },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      overallScore: true,
    },
  });

  return NextResponse.json({ student });
}

// Delete student (and their scores)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.score.deleteMany({
    where: { studentId: id },
  });

  await prisma.student.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
