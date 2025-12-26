import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const classes = await prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      subject: true,
      term: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ classes });
}

export async function POST(req: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name, gradeLevel, subject, term } = body ?? {};

  if (!name || !gradeLevel || !subject) {
    return NextResponse.json(
      { error: "name, gradeLevel, and subject are required" },
      { status: 400 }
    );
  }

  const cls = await prisma.class.create({
    data: {
      teacherId,
      name,
      gradeLevel,
      subject,
      term: term ?? null,
    },
  });

  return NextResponse.json({ class: cls });
}

export async function DELETE(req: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const cls = await prisma.class.findFirst({
    where: { id, teacherId },
    select: { id: true },
  });

  if (!cls) {
    return NextResponse.json(
      { error: "Class not found" },
      { status: 404 }
    );
  }

  await prisma.score.deleteMany({
    where: {
      student: {
        classId: id,
      },
    },
  });

  await prisma.subcategory.deleteMany({
    where: {
      category: {
        classId: id,
      },
    },
  });

  await prisma.category.deleteMany({
    where: { classId: id },
  });

  await prisma.student.deleteMany({
    where: { classId: id },
  });

  await prisma.class.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
