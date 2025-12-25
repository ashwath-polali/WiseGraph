// src/components/DeleteClassButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface DeleteClassButtonProps {
  classId: string;
}

export function DeleteClassButton({ classId }: DeleteClassButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this class and all its students, categories, and scores?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classId }),
      });

      if (!res.ok) {
        console.error("Failed to delete class");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-xs text-red-400 hover:text-red-300"
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? "Deleting…" : "Delete class"}
    </Button>
  );
}
