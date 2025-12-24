// app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const { classId, name, gradeLevel, overallScore } = body ?? {};
  if (!classId || !name || !gradeLevel || typeof overallScore !== "number") {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  // basic clamp to 60–150 range, optional
  const score = Math.max(60, Math.min(150, overallScore));

  const student = await prisma.student.create({
    data: {
      classId,
      name,
      gradeLevel,
      overallScore: score,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
