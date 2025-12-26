import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import { Card } from "@/components/ui/Card";
import { SettingsClient } from "@/components/SettingsClient";

export default async function SettingsPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    // layout already redirects if unauthenticated
    return null;
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

  const classes = await prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, subject: true },
  });

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-5xl py-6 px-2">
        <Card className="flex flex-col gap-6 p-6 md:flex-row">
          {/* Side panel */}
          <aside className="w-full border-b border-slate-800 pb-4 md:w-56 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <h1 className="text-lg font-semibold text-slate-50">Settings</h1>
            <p className="mt-1 text-xs text-slate-400">
              Customize your WiseMetrics account and classroom defaults.
            </p>

            <nav className="mt-4 space-y-1 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Sections</p>
              <button
                type="button"
                className="mt-1 w-full rounded bg-slate-900/60 px-2 py-1 text-left text-[11px] text-slate-100"
              >
                Account info
              </button>
              <button
                type="button"
                className="w-full rounded px-2 py-1 text-left text-[11px] text-slate-300 hover:bg-slate-900/60"
              >
                App behavior
              </button>
              <button
                type="button"
                className="w-full rounded px-2 py-1 text-left text-[11px] text-slate-300 hover:bg-slate-900/60"
              >
                Shortcuts
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <SettingsClient teacher={teacher} classes={classes} />
          </div>
        </Card>
      </section>
    </main>
  );
}
