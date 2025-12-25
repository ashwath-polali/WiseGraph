// app/(dashboard)/dashboard/settings/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import { Card } from "@/components/ui/Card";
import { SettingsClient } from "@/components/SettingsClient";

export default async function SettingsPage() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    // Dashboard layout already handles redirects if not authenticated.
    return null;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      // IMPORTANT: do NOT include school/defaultClassId/defaultStudentView
    },
  });

  const classes = await prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="mx-auto max-w-2xl py-6 px-2">
        <Card className="space-y-6 p-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Settings</h1>
            <p className="mt-1 text-xs text-slate-400">
              Update your WiseMetrics profile.
            </p>
          </div>
          <SettingsClient teacher={teacher} classes={classes} />
        </Card>
      </section>
    </main>
  );
}
