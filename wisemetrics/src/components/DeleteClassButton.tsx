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
      const res = await fetch(
        `/api/classes?id=${encodeURIComponent(classId)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to delete class", res.status, text);
        return;
      }

      // After delete, let the dashboard pick the next/default class
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
