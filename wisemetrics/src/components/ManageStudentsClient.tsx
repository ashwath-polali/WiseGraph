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
  const [students, setStudents] = useState<StudentScoreSummary[]>(
    initialStudents
  );
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [overallScore, setOverallScore] = useState<string>("100");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !gradeLevel.trim()) return;

    const scoreNumber = Number(overallScore);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        overallScore: Number.isFinite(scoreNumber) ? scoreNumber : 100,
      }),
    });

    if (!res.ok) {
      console.error("Failed to add student", await res.text());
      return;
    }

    const { student } = await res.json();

    setStudents((prev) => [
      ...prev,
      {
        id: student.id,
        name: student.name,
        gradeLevel: student.gradeLevel,
        overallScore: student.overallScore,
        categories: [],
      },
    ]);

    setName("");
    setGradeLevel("");
    setOverallScore("100");
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    const ok = window.confirm(
      `Are you sure you want to delete student "${name}"? This will remove all of their scores.`
    );
    if (!ok) return;

    const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete student", await res.text());
      return;
    }

    setStudents((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add student form */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-slate-400">
            Name
          </label>
          <Input
            placeholder="Student name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="w-24 space-y-1">
          <label className="text-xs font-medium text-slate-400">
            Grade
          </label>
          <Input
            placeholder="6"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
        </div>

        <div className="w-28 space-y-1">
          <label className="text-xs font-medium text-slate-400">
            Overall
          </label>
          <Input
            placeholder="100"
            value={overallScore}
            onChange={(e) => setOverallScore(e.target.value)}
          />
        </div>

        <Button type="submit" className="whitespace-nowrap text-xs">
          Add student
        </Button>
      </form>

      {/* Students table */}
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
        {students.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-500">
            No students yet. Add your roster to start tracking performance.
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/70 text-slate-400">
                <th className="px-2 py-2 text-left font-normal">Name</th>
                <th className="px-2 py-2 text-left font-normal">Grade</th>
                <th className="px-2 py-2 text-left font-normal">Overall</th>
                <th className="px-2 py-2 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-slate-800 text-slate-100"
                >
                  <td className="px-2 py-1">{student.name}</td>
                  <td className="px-2 py-1 text-slate-400">
                    {student.gradeLevel}
                  </td>
                  <td className="px-2 py-1 text-slate-400">
                    {student.overallScore}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(student.id, student.name)}
                      className="text-[11px] text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
