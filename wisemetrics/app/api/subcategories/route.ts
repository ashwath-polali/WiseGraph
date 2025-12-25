// app/api/subcategories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create subcategory
export async function POST(req: Request) {
  const body = await req.json();
  const { categoryId, name } = body ?? {};

  if (!categoryId || !name) {
    return NextResponse.json(
      { error: "categoryId and name are required" },
      { status: 400 }
    );
  }

  const subcategory = await prisma.subcategory.create({
    data: {
      categoryId,
      name,
    },
    select: {
      id: true,
      name: true,
      order: true,
      categoryId: true,
    },
  });

  return NextResponse.json({ subcategory });
}

// Delete subcategory (and its scores)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Delete scores tied to this subcategory
  await prisma.score.deleteMany({
    where: { subcategoryId: id },
  });

  // Delete the subcategory itself
  await prisma.subcategory.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
