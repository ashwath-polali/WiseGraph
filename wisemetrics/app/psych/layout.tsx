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
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                {/* outer gear teeth */}
                <path
                  d="M12 1.5 13.2 3.9 15.8 4.2 16.5 6.7 18.8 7.9 18.1 10.4 19.5 12 18.1 13.6 18.8 16.1 16.5 17.3 15.8 19.8 13.2 20.1 12 22.5 10.8 20.1 8.2 19.8 7.5 17.3 5.2 16.1 5.9 13.6 4.5 12 5.9 10.4 5.2 7.9 7.5 6.7 8.2 4.2 10.8 3.9 12 1.5Z"
                  fill="currentColor"
                />
                {/* inner circle */}
                <circle cx="12" cy="12" r="4" className="fill-card" />
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
