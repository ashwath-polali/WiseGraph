// app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create student
export async function POST(req: Request) {
  const body = await req.json();
  const { classId, name, gradeLevel, overallScore } = body ?? {};

  if (!classId || !name || !gradeLevel || typeof overallScore !== "number") {
    return NextResponse.json(
      { error: "classId, name, gradeLevel, overallScore are required" },
      { status: 400 }
    );
  }

  const student = await prisma.student.create({
    data: {
      classId,
      name,
      gradeLevel,
      overallScore,
    },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      overallScore: true,
      // fields for StudentScoreSummary
      scores: false,
    },
  });

  return NextResponse.json({ student });
}

// Update student (name, grade, overallScore)
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, name, gradeLevel, overallScore } = body ?? {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(gradeLevel !== undefined ? { gradeLevel } : {}),
      ...(typeof overallScore === "number" ? { overallScore } : {}),
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

// Delete student and their scores
export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body ?? {};

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Delete scores first (FK constraint)
  await prisma.score.deleteMany({
    where: { studentId: id },
  });

  // Then delete student
  await prisma.student.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
