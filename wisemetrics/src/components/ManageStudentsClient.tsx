"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newOverall, setNewOverall] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName || !newGrade || !newOverall) return;

    const overallScore = Number(newOverall);
    if (Number.isNaN(overallScore)) return;

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        name: newName,
        gradeLevel: newGrade,
        overallScore,
      }),
    });

    if (!res.ok) {
      console.error("Failed to add student");
      return;
    }

    const data = await res.json();
    const created = data.student as StudentScoreSummary;

    setStudents((prev) => [...prev, created]);
    setNewName("");
    setNewGrade("");
    setNewOverall("");
    router.refresh();
  }

  async function handleSave(student: StudentScoreSummary) {
    setSavingId(student.id);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: student.id,
          name: student.name,
          gradeLevel: student.gradeLevel,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update student");
        return;
      }

      const data = await res.json();
      const updated = data.student as StudentScoreSummary;

      setStudents((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Delete ${name}? This will remove all of their scores in this class.`
      )
    ) {
      return;
    }

    const res = await fetch("/api/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      console.error("Failed to delete student");
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
        className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">Name</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">Grade (9–12)</label>
          <Input
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            className="w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-slate-400">
            Overall score (60–150)
          </label>
          <Input
            type="number"
            value={newOverall}
            onChange={(e) => setNewOverall(e.target.value)}
            className="w-28"
          />
        </div>
        <Button type="submit" variant="default" className="text-xs h-8 px-3">
          Add student
        </Button>
      </form>

      {/* Students table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/70">
            <tr>
              <th className="px-3 py-2 font-medium text-slate-300">Name</th>
              <th className="px-3 py-2 font-medium text-slate-300">Grade</th>
              <th className="px-3 py-2 font-medium text-slate-300">
                Overall score
              </th>
              <th className="px-3 py-2 font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-3 py-2">
                  <Input
                    value={student.name}
                    onChange={(e) =>
                      setStudents((prev) =>
                        prev.map((s) =>
                          s.id === student.id
                            ? { ...s, name: e.target.value }
                            : s
                        )
                      )
                    }
                    className="h-7 text-[11px]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={student.gradeLevel}
                    onChange={(e) =>
                      setStudents((prev) =>
                        prev.map((s) =>
                          s.id === student.id
                            ? { ...s, gradeLevel: e.target.value }
                            : s
                        )
                      )
                    }
                    className="h-7 w-20 text-[11px]"
                  />
                </td>
                <td className="px-3 py-2">
                  <span className="text-[11px] text-slate-200">
                    {student.overallScore}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/students/${student.id}/edit-scores`}
                      className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                    >
                      Edit scores
                    </Link>
                    <Button
                      type="button"
                      variant="default"
                      className="h-7 px-2 text-[11px]"
                      disabled={savingId === student.id}
                      onClick={() => handleSave(student)}
                    >
                      {savingId === student.id ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(student.id, student.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-[11px] text-slate-500"
                >
                  No students yet. Use the form above to add your high school
                  roster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
