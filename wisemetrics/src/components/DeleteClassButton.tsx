"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface DeleteClassButtonProps {
  classId: string;
  className?: string;
}

export function DeleteClassButton({ classId, className }: DeleteClassButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete ${className ?? "this class"}? This will remove all students, scores, and categories.`
      )
    ) {
      return;
    }

    setLoading(true);

    const res = await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: classId }),
    });

    if (!res.ok) {
      console.error("Failed to delete class");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      className="text-xs text-destructive/80 hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting…" : "Delete class"}
    </Button>
  );
}
