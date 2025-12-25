// src/components/CreateFirstClassButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateFirstClassButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");
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
        variant="primary"
        className="text-sm"
        onClick={() => setOpen(true)}
      >
        Create class
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Class name (e.g., Period 1 – Reading)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Grade level (e.g., 6)"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        />
        <Input
          placeholder="Subject (e.g., Reading)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Input
          placeholder="Term (optional)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={loading}
          onClick={handleCreate}
          className="text-sm"
        >
          {loading ? "Creating…" : "Save class"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
