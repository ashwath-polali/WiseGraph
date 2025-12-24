// app/(dashboard)/dashboard/layout.tsx
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/LogoutButton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-semibold">WiseMetrics</h1>
        <LogoutButton />
      </header>

      <section className="px-6 py-4">
        <Card className="bg-slate-950 border-none shadow-none">
          {children}
        </Card>
      </section>
    </main>
  );
}
