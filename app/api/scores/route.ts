import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, categoryId, subcategoryId, standardScore } = body;

    // Validate the category/subcategory exists if provided
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      
      if (!categoryExists) {
        return NextResponse.json(
          { error: `Category ${categoryId} not found` },
          { status: 400 }
        );
      }
    }

    if (subcategoryId) {
      const subcategoryExists = await prisma.subcategory.findUnique({
        where: { id: subcategoryId },
      });
      
      if (!subcategoryExists) {
        return NextResponse.json(
          { error: `Subcategory ${subcategoryId} not found` },
          { status: 400 }
        );
      }
    }

    // Check if score already exists
    const existing = await prisma.score.findFirst({
      where: {
        studentId,
        categoryId: categoryId ?? null,
        subcategoryId: subcategoryId ?? null,
      },
    });

    const score = await prisma.score.upsert({
      where: {
        id: existing?.id ?? "___dummy___",
      },
      create: {
        studentId,
        categoryId: categoryId ?? null,
        subcategoryId: subcategoryId ?? null,
        standardScore,
      },
      update: {
        standardScore,
      },
    });

    return NextResponse.json(score);
  } catch (error: any) {
    console.error("Score save error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to save score",
        code: error.code,
        details: error.meta 
      },
      { status: 500 }
    );
  }
}
