// src/components/CreateFirstClassButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateFirstClassButton() {
  const [name, setName] = useState("Period 1 – Reading");
  const [gradeLevel, setGradeLevel] = useState("9–10");
  const [subject, setSubject] = useState("Reading");
  const [term, setTerm] = useState("Fall 2025");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setIsCreating(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gradeLevel, subject, term }),
      });

      if (!res.ok) {
        console.error("Failed to create class", await res.text());
        return;
      }

      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  const disabled = isCreating || !name.trim() || !gradeLevel.trim() || !subject.trim();

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-200">
            Class name
          </label>
          <Input
            placeholder="Period 1 – Reading"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            How it appears in your dashboard list (e.g. “Period 3 – Math”).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-200">
            Grade level(s)
          </label>
          <Input
            placeholder="6–7"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            Grade or range for this class (e.g. “9”, “9–10”, “Mixed 10–12”).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-200">
            Subject
          </label>
          <Input
            placeholder="Reading"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            Main content area (Reading, Writing, Math…).
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-200">
            Term (optional)
          </label>
          <Input
            placeholder="Fall 2025"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <p className="text-[11px] text-slate-500">
            Semester, trimester, or year label used in reports.
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={handleCreate}
        disabled={disabled}
        className="text-xs"
      >
        {isCreating ? "Creating..." : "Create class"}
      </Button>
    </div>
  );
}
