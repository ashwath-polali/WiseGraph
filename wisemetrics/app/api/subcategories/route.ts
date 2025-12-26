import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.score.deleteMany({
    where: { subcategoryId: id },
  });

  await prisma.subcategory.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
