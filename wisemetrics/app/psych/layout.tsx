import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function PsychLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/auth/login');
  
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { accountType: true },
  });
  
  if (teacher?.accountType !== 'psychologist') {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top nav */}
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        {/* Brand → click to go back to dashboard */}
        <Link href="/psych/dashboard" className="flex items-center gap-2 text-sm">
          <span className="font-semibold">WiseMetrics</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {/* Back button */}
          <Link
            href="/psych/dashboard"
            className="text-slate-400 hover:text-slate-300 text-xs"
            title="Back to dashboard"
          >
            Dashboard
          </Link>

          {/* Settings button with a clean gear icon */}
          <Link
            href="/psych/settings"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800"
            aria-label="Settings"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 text-slate-200"
              aria-hidden="true"
            >
              {/* outer gear teeth */}
              <path
                d="M12 1.5 13.2 3.9 15.8 4.2 16.5 6.7 18.8 7.9 18.1 10.4 19.5 12 18.1 13.6 18.8 16.1 16.5 17.3 15.8 19.8 13.2 20.1 12 22.5 10.8 20.1 8.2 19.8 7.5 17.3 5.2 16.1 5.9 13.6 4.5 12 5.9 10.4 5.2 7.9 7.5 6.7 8.2 4.2 10.8 3.9 12 1.5Z"
                className="fill-slate-400"
              />
              {/* inner circle */}
              <circle cx="12" cy="12" r="4" className="fill-slate-950" />
            </svg>
          </Link>

          {/* Log out */}
          <LogoutButton />
        </div>
      </header>

      {/* full-width content with just side padding */}
      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
