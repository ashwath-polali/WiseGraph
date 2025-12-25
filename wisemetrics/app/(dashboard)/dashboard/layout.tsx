// app/(dashboard)/dashboard/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="text-sm font-medium text-slate-200">
          WiseMetrics
        </div>
        <LogoutButton />
      </header>

      {/* full-width content with just side padding */}
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
