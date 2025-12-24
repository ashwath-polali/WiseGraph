// app/api/subcategories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { categoryId, name } = body ?? {};

  if (!categoryId || !name) {
    return NextResponse.json(
      { error: "Missing categoryId or name" },
      { status: 400 }
    );
  }

  const subcategory = await prisma.subcategory.create({
    data: {
      categoryId,
      name,
      order: 0,
    },
  });

  return NextResponse.json(
    { id: subcategory.id, name: subcategory.name },
    { status: 201 }
  );
}
