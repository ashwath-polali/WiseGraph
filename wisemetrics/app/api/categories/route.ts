// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { classId, name } = body ?? {};

  if (!classId || !name) {
    return NextResponse.json(
      { error: "Missing classId or name" },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({
    data: {
      classId,
      name,
      order: 0,
    },
  });

  // score is not stored on Category; caller treats it as 100 by default
  return NextResponse.json(
    { id: category.id, name: category.name, score: 100 },
    { status: 201 }
  );
}
