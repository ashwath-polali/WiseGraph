"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
  evaluationId: string;
}

export function SyncCategoriesButton({ evaluationId }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync-universal-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to sync");
        return;
      }

      if (data.added.categories === 0 && data.added.subcategories === 0) {
        setMessage("Already up to date!");
      } else {
        setMessage(
          `Added ${data.added.categories} categories and ${data.added.subcategories} subcategories`
        );
        router.refresh();
      }
    } catch (error) {
      setMessage("Error syncing categories");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={handleSync}
        disabled={syncing}
        variant="secondary"
        className="inline-flex items-center gap-2"
      >
        <svg
          className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {syncing ? "Syncing..." : "Sync Categories"}
      </Button>
      {message && (
        <div className="absolute top-full mt-2 left-0 whitespace-nowrap bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700">
          {message}
        </div>
      )}
    </div>
  );
}
