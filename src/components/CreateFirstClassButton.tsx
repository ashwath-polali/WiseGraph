"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateFirstClassButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");        // "Period 1 – Algebra II"
  const [gradeLevel, setGradeLevel] = useState(""); // "10"
  const [subject, setSubject] = useState("");  // "Algebra II"
  const [term, setTerm] = useState("");        // "Fall 2025"
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name || !gradeLevel || !subject) return;
    setLoading(true);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gradeLevel,
          subject,
          term: term || null,
        }),
      });

      if (!res.ok) {
        console.error("Failed to create class");
        return;
      }

      const data = await res.json();
      const newId = data.id as string;

      setOpen(false);
      setName("");
      setGradeLevel("");
      setSubject("");
      setTerm("");

      router.push(`/dashboard?classId=${encodeURIComponent(newId)}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="default"
        className="text-xs"
        onClick={() => setOpen(true)}
      >
        New class
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        placeholder="Class name (e.g., Period 1: Algebra II)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-[220px]"
      />
      <Input
        placeholder="Grade level"
        value={gradeLevel}
        onChange={(e) => setGradeLevel(e.target.value)}
        className="w-24"
      />
      <Input
        placeholder="Subject (e.g., Algebra II)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="min-w-[160px]"
      />
      <Input
        placeholder="Term (e.g., Fall 2025)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="min-w-[140px]"
      />
      <Button
        type="button"
        variant="default"
        onClick={handleCreate}
        disabled={loading}
        className="text-xs"
      >
        {loading ? "Creating…" : "Save"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(false)}
        className="text-xs"
      >
        Cancel
      </Button>
    </div>
  );
}
