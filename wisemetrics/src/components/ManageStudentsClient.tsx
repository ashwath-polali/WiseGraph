// src/components/ManageStudentsClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { StudentScoreSummary } from "@/types/scores";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  classId: string;
  initialStudents: StudentScoreSummary[];
}

export function ManageStudentsClient({ classId, initialStudents }: Props) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [overallScore, setOverallScore] = useState<string>("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const scoreNumber = Number(overallScore);
    if (!name || !gradeLevel || Number.isNaN(scoreNumber)) {
      // you can add better validation later
      return;
    }

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        name,
        gradeLevel,
        overallScore: scoreNumber,
      }),
    });

    if (!res.ok) {
      console.error("Failed to create student");
      return;
    }

    const created = await res.json();
    setStudents((prev) => [...prev, created]);
    setName("");
    setGradeLevel("");
    setOverallScore("");
    router.refresh(); // keep server data in sync
  }

  return (
    <div className="space-y-4">
      {/* Add student form */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end"
      >
        <Input
          placeholder="Student name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Grade"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        />
        <Input
          placeholder="Overall score"
          value={overallScore}
          onChange={(e) => setOverallScore(e.target.value)}
        />
        <Button type="submit">Add student</Button>
      </form>

      {/* Students table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Grade</th>
              <th className="px-2 py-2">Overall score</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-slate-900">
                <td className="px-2 py-2 text-slate-50">{s.name}</td>
                <td className="px-2 py-2 text-slate-300">{s.gradeLevel}</td>
                <td className="px-2 py-2 text-slate-300">
                  {s.overallScore}
                </td>
                <td className="px-2 py-2">
                  <a
                    href={`/dashboard/students/${s.id}`}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    View
                  </a>
                  {/* Edit/delete can be added later */}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-2 py-4 text-center text-slate-500 text-xs"
                >
                  No students yet. Use the form above to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
