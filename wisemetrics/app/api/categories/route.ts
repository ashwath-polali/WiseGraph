// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create category
export async function POST(req: Request) {
  const body = await req.json();
  const { classId, name } = body ?? {};

  if (!classId || !name) {
    return NextResponse.json(
      { error: "classId and name are required" },
      { status: 400 }
    );
  }

  const last = await prisma.category.findFirst({
    where: { classId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const nextOrder = (last?.order ?? 0) + 1;

  const category = await prisma.category.create({
    data: {
      classId,
      name,
      order: nextOrder,
    },
  });

  // score is not stored on Category; caller treats it as 100 by default
  return NextResponse.json({
    id: category.id,
    name: category.name,
    score: 100,
  });
}

// Delete category (plus subcategories and scores)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Delete scores tied to this category or its subcategories
  await prisma.score.deleteMany({
    where: {
      OR: [
        { categoryId: id },
        {
          subcategory: {
            categoryId: id,
          },
        },
      ],
    },
  });

  // Delete subcategories
  await prisma.subcategory.deleteMany({
    where: { categoryId: id },
  });

  // Delete category
  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
