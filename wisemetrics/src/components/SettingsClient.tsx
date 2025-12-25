// src/components/SettingsClient.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResetPasswordClient } from "@/components/ResetPasswordClient";

type ViewMode = "polar" | "bell" | "concentric";

type TeacherSettings = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | Date;
  school?: string;
  defaultClassId?: string;
  defaultStudentView?: ViewMode;
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
  const [school, setSchool] = useState(teacher?.school ?? "");
  const [defaultClassId, setDefaultClassId] = useState(
    teacher?.defaultClassId ?? ""
  );
  const [defaultStudentView, setDefaultStudentView] = useState<ViewMode>(
    teacher?.defaultStudentView ?? "polar"
  );
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!teacher) return;
    setStatus("saving");

    try {
      const accountRes = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!accountRes.ok) {
        throw new Error(await accountRes.text());
      }

      // If you’re abandoning the default settings feature entirely, you can
      // safely no-op here or only keep name/email in /api/teacher too.
      setStatus("success");
      router.refresh();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account info */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-50">Account</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-slate-500">
            Joined{" "}
            {teacher
              ? new Date(teacher.createdAt).toLocaleDateString()
              : "recently"}
            .
          </p>
          {/* Reset password moved directly under email */}
          <div className="mt-1">
            <p className="text-[11px] text-slate-500 mb-1">
              Send yourself a one‑time link to reset your password.
            </p>
            <ResetPasswordClient initialEmail={teacher?.email ?? ""} />
          </div>
        </div>
      </section>

      {/* App defaults (can leave as-is or strip if you’re dropping the feature) */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-50">App defaults</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs text-slate-400">
              School / district
            </label>
            <Input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="School name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Default class
            </label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
              value={defaultClassId}
              onChange={(e) => setDefaultClassId(e.target.value)}
            >
              <option value="">First class created</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} – {c.subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Default student view
            </label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50"
              value={defaultStudentView}
              onChange={(e) =>
                setDefaultStudentView(
                  e.target.value as "polar" | "bell" | "concentric"
                )
              }
            >
              <option value="polar">Polar radar</option>
              <option value="bell">Bell curve</option>
              <option value="concentric">Concentric radial</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save + feedback */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save settings"}
        </Button>
        {status === "success" && (
          <p className="text-xs text-emerald-400">Saved.</p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-400">
            Could not save settings. Please try again.
          </p>
        )}
        <Link
          href="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Back to dashboard
        </Link>
      </div>
    </form>
  );
}
