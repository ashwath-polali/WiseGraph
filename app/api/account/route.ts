import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export async function PATCH(req: Request) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const { name, email } = body ?? {};

  // Update email in Supabase auth
  if (email) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
  }

  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return NextResponse.json({ teacher });
}
