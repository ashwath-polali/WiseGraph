import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { studentId, categoryId, subcategoryId, standardScore } =
      await req.json();

    if (!studentId || typeof standardScore !== "number") {
      return NextResponse.json(
        { error: "studentId and standardScore are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.score.findFirst({
      where: {
        studentId,
        categoryId: categoryId ?? null,
        subcategoryId: subcategoryId ?? null,
      },
    });

    const score = await prisma.score.upsert({
      where: {
        id: existing?.id ?? "___dummy___", // will not match if no existing row
      },
      update: {
        standardScore,
      },
      create: {
        studentId,
        categoryId: categoryId ?? null,
        subcategoryId: subcategoryId ?? null,
        standardScore,
      },
    });

    return NextResponse.json({
      id: score.id,
      standardScore: score.standardScore,
    });
  } catch (err) {
    console.error("Failed to upsert score", err);
    return NextResponse.json(
      { error: "Failed to upsert score" },
      { status: 500 }
    );
  }
}
