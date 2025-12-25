// src/lib/currentTeacher.ts
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function getCurrentTeacherId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  // email is unique, so this is safe once duplicates are cleaned up
  const teacher = await prisma.teacher.upsert({
    where: { email: user.email },
    update: {
      name:
        (user.user_metadata as any)?.full_name ??
        user.email,
    },
    create: {
      email: user.email,
      name:
        (user.user_metadata as any)?.full_name ??
        user.email,
    },
  });

  return teacher.id;
}
