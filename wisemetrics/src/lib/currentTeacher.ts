import { createSupabaseServerClient } from './supabaseServer';
import { prisma } from './prisma';

export async function getCurrentTeacherId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) return null;

  // Parse aliased email back to original
  // teacher+psych@domain.com → teacher@domain.com
  const originalEmail = user.email.replace('+psych@', '@');

  // Determine account type from email alias
  const accountType = user.email.includes('+psych@') ? 'psychologist' : 'teacher';

  // Find Teacher record by original email + account type
  const teacher = await prisma.teacher.findFirst({
    where: {
      email: originalEmail,
      accountType: accountType,
    },
  });

  return teacher?.id ?? null;
}
