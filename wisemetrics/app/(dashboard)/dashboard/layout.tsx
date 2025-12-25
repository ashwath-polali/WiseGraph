// app/(dashboard)/dashboard/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
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
      {/* Top nav */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2">
        {/* Brand → click to go back to dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-slate-100"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-sky-500/10 text-xs font-semibold text-sky-400">
            W
          </span>
          <span>WiseMetrics</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Explicit return-to-dashboard button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
          >
            Back to dashboard
          </Link>

          {/* Settings button with a clean gear icon */}
          <Link
            href="/dashboard/settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-slate-50"
            aria-label="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              {/* outer gear teeth */}
              <path
                d="M12 3.75l1.05 1.82 2.1.36 1.48-1.48 1.82 1.82-1.48 1.48.36 2.1 1.82 1.05-1.05 1.82-2.1-.36-1.48 1.48.36 2.1-1.82 1.05-1.05-1.05-2.1-.36-1.48 1.48-1.82-1.82 1.48-1.48-.36-2.1-1.82-1.05 1.05-1.82 2.1.36 1.48-1.48-.36-2.1L10.5 5.57 12 3.75Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* inner circle */}
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </Link>

          <LogoutButton />
        </div>
      </header>

      {/* full-width content with just side padding */}
      <main className="px-4 pb-6 pt-3">{children}</main>
    </div>
  );
}
