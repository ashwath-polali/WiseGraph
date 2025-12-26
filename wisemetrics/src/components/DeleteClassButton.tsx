// src/components/DeleteClassButton.tsx
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
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      const res = await fetch("/api/classes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      });

      if (!res.ok) {
        console.error("Failed to delete class");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-[11px]">
        <span className="truncate text-red-200/90">
          Delete this class and all of its students&apos; scores.
        </span>
        <Button
          variant="ghost"
          className="shrink-0 border border-red-800/80 bg-red-950/80 px-3 py-1 text-xs font-medium text-red-100 hover:border-red-500 hover:bg-red-900/90 hover:text-red-50"
          onClick={() => setConfirming(true)}
        >
          Delete class…
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-900 bg-red-950/95 px-3 py-2 text-[11px]">
      <span className="truncate text-red-50">
        Permanently delete{" "}
        <span className="font-mono">
          {className ?? "this class"}
        </span>
        ? This cannot be undone.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          className="px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/70"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="bg-red-600 px-3 py-1 text-xs font-semibold text-red-50 hover:bg-red-500 disabled:opacity-60"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
