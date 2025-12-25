// src/components/SettingsClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type TeacherSettings = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | Date;
  // no school/defaultClassId/defaultStudentView yet
};

type ClassOption = {
  id: string;
  name: string;
};

interface Props {
  teacher: TeacherSettings | null;
  classes: ClassOption[];
}

export function SettingsClient({ teacher, classes }: Props) {
  const router = useRouter();
  const [name, setName] = useState(teacher?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/teacher", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Profile */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">Profile</h2>
        <div className="space-y-2">
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
              value={teacher?.email ?? ""}
              disabled
              className="opacity-70"
            />
          </div>
        </div>
      </div>

      {/* For now, classes is unused, but you can add defaults later */}

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
