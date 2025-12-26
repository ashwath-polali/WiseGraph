import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return NextResponse.json(teacher);
}

export async function PATCH(req: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const {
    name,
    school,
    defaultClassId,
    defaultStudentView,
  }: {
    name?: string;
    school?: string | null;
    defaultClassId?: string | null;
    defaultStudentView?: "polar" | "bell" | "concentric";
  } = body;

  const data: any = {};

  if (typeof name === "string") data.name = name;
  if (school !== undefined) data.school = school;
  if (defaultClassId !== undefined) data.defaultClassId = defaultClassId;
  if (defaultStudentView !== undefined) data.defaultStudentView = defaultStudentView;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.teacher.update({
    where: { id: teacherId },
    data,
  });

  return NextResponse.json({ ok: true });
}
