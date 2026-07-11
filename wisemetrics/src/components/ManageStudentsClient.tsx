"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import type { StudentScoreSummary } from "@/types/scores";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
        `Delete ${name}? This removes all of their scores in this class.`
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
      <Card className="p-0">
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 p-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Grade (9–12)
            </label>
            <Input
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="w-24"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Overall score (60–150)
            </label>
            <Input
              type="number"
              value={newOverall}
              onChange={(e) => setNewOverall(e.target.value)}
              className="w-28"
            />
          </div>
          <Button type="submit" variant="default" size="sm">
            Add student
          </Button>
        </form>
      </Card>

      {/* Students table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Grade
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Overall score
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student, i) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.03,
                  }}
                  className="transition-colors duration-150 hover:bg-accent/40"
                >
                  <td className="px-5 py-3">
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
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-5 py-3">
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
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      data-numeric
                      className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
                    >
                      {student.overallScore}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                        })}
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/students/${student.id}/edit-scores`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                        })}
                      >
                        Edit scores
                      </Link>
                      <Button
                        type="button"
                        variant="default"
                        size="xs"
                        disabled={savingId === student.id}
                        onClick={() => handleSave(student)}
                      >
                        {savingId === student.id ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        onClick={() => handleDelete(student.id, student.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-xs text-muted-foreground"
                  >
                    No students yet. Add your first from the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
