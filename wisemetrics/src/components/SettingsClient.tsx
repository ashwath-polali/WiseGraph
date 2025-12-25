// src/components/SettingsClient.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResetPasswordClient } from "@/components/ResetPasswordClient";

type TeacherSettings = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | Date;
};

type ClassOption = {
  id: string;
  name: string;
  subject: string;
};

interface Props {
  teacher: TeacherSettings | null;
  classes: ClassOption[];
}

export function SettingsClient({ teacher, classes }: Props) {
  const router = useRouter();
  const [name, setName] = useState(teacher?.name ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [defaultClassId, setDefaultClassId] = useState<string>("");
  const [defaultStudentView, setDefaultStudentView] =
    useState<string>("polar");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Failed to save settings");
        console.error("Failed to save settings", res.status, text);
        return;
      }

      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {/* Account info */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Account info
        </h2>
        <p className="text-[11px] text-slate-400">
          Basic details about your teacher account.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Display name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ms. Martinez"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. teacher@example.com"
            />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="text-[11px] font-semibold text-slate-200">
            Password
          </h3>
          <p className="text-[11px] text-slate-500">
            Send a reset link to your email, then choose a new password on
            the reset page.
          </p>
          <ResetPasswordClient initialEmail={teacher?.email ?? ""} />
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* App behavior */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          App behavior
        </h2>
        <p className="text-[11px] text-slate-400">
          Choose how WiseMetrics behaves when you open the dashboard.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Default class on open
            </label>
            <select
              className="h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
              value={defaultClassId}
              onChange={(e) => setDefaultClassId(e.target.value)}
            >
              <option value="">First class in list</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.subject}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Visual only for now; will become active once stored in
              teacher settings.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              Default student chart view
            </label>
            <select
              className="h-8 w-full rounded border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
              value={defaultStudentView}
              onChange={(e) => setDefaultStudentView(e.target.value)}
            >
              <option value="polar">Polar radar</option>
              <option value="bell">Bell curve</option>
              <option value="concentric">Concentric rings</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Planned: controls the initial view in student detail pages.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* Shortcuts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Shortcuts</h2>
        <p className="text-[11px] text-slate-400">
          Jump directly to the tools you use most often.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/configure-assessment"
            className="inline-flex items-center rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
          >
            Configure assessments
          </Link>
          <Link
            href="/dashboard/manage-students"
            className="inline-flex items-center rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
          >
            Manage students
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
          >
            Open dashboard
          </Link>
        </div>
      </section>

      {/* Save + feedback */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-[11px] text-slate-400">
          {error && <span className="text-red-400">{error}</span>}
          {!error && saved && (
            <span className="text-emerald-400">Settings saved.</span>
          )}
        </div>
        <Button type="submit" disabled={saving} className="text-xs">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
