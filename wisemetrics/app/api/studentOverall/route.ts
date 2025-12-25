// app/api/studentOverall/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { studentId, overallScore } = await req.json();

    if (!studentId || typeof overallScore !== "number") {
      return NextResponse.json(
        { error: "studentId and overallScore are required" },
        { status: 400 }
      );
    }

    const clamped = Math.max(60, Math.min(150, overallScore));

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { overallScore: clamped },
    });

    return NextResponse.json({
      id: student.id,
      overallScore: student.overallScore,
    });
  } catch (err) {
    console.error("Failed to update overall score", err);
    return NextResponse.json(
      { error: "Failed to update overall score" },
      { status: 500 }
    );
  }
}
