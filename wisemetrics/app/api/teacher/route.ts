// app/api/teacher/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

// Get current teacher basic settings
export async function GET() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      // NOTE: no school/defaultClassId/defaultStudentView here yet
    },
  });

  return NextResponse.json({ teacher });
}

// Update teacher basic settings (currently just name)
export async function PATCH(req: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name } = body ?? {};

  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ...(name !== undefined ? { name } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ teacher });
}
