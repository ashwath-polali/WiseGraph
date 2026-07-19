import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function PsychLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');
  
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { accountType: true },
  });
  
  if (teacher?.accountType !== 'psychologist') {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Brand → click to go back to dashboard */}
          <Link href="/psych/dashboard" className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="11" className="stroke-border" strokeWidth="1" />
              <path d="M12 12 L12 2.5 A9.5 9.5 0 0 1 20.2 7.3 Z" className="fill-psych" />
              <path d="M12 12 L20.2 7.3 A9.5 9.5 0 0 1 18.7 18.7 Z" className="fill-psych/45" />
              <path d="M12 12 L18.7 18.7 A9.5 9.5 0 0 1 5.3 18.7 Z" className="fill-primary/50" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">
              WiseGraph
              <span className="ml-1.5 text-[11px] font-medium text-psych">Psych</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Back button */}
            <Link
              href="/psych/dashboard"
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              title="Back to dashboard"
            >
              Dashboard
            </Link>

            <ThemeToggle />

            {/* Settings button with a clean gear icon */}
            <Link
              href="/psych/settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              aria-label="Settings"
            >
              <svg
                className="h-[15px] w-[15px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.98 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.98a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09c0 .68.4 1.29 1.03 1.56a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.27.63.88 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
              </svg>
            </Link>

            {/* Log out */}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* full-width content with just side padding */}
      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
