import { getCurrentTeacherId } from '@/lib/currentTeacher';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { SettingsClient } from '@/components/SettingsClient';

export default async function PsychSettingsPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) redirect('/login');
  
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      accountType: true,
    },
  });
  
  if (!teacher || teacher.accountType !== 'psychologist') {
    redirect('/dashboard');
  }
  
  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-5xl py-6 px-2">
        <Card className="flex flex-col gap-6 p-6 md:flex-row">
          {/* Side panel */}
          <aside className="w-full border-b border-border pb-4 md:w-56 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <h1 className="font-display text-lg font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Customize your WiseMetrics account.
            </p>

            <nav className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Sections</p>
              <button
                type="button"
                className="mt-1 w-full rounded-md bg-muted px-2 py-1 text-left text-[11px] font-medium text-foreground"
              >
                Account info
              </button>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1 text-left text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                Danger zone
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <SettingsClient 
              teacher={{
                id: teacher.id,
                email: teacher.email,
                name: teacher.name,
                createdAt: teacher.createdAt,
              }}
              classes={[]}
              accountType={teacher.accountType}
              teacherId={teacher.id}
            />
          </div>
        </Card>
      </section>
    </main>
  );
}
