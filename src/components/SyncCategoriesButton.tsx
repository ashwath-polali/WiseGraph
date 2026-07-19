"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";

interface Props {
  evaluationId: string;
  /** icon-only, for tight control bars */
  compact?: boolean;
}

export function SyncCategoriesButton({ evaluationId, compact = false }: Props) {
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
        setMessage(data.error || "We couldn't sync. Please try again.");
        return;
      }

      if (data.added.categories === 0 && data.added.subcategories === 0) {
        setMessage("Already up to date.");
      } else {
        setMessage(
          `Added ${data.added.categories} categories and ${data.added.subcategories} subskills.`
        );
        router.refresh();
      }
    } catch (error) {
      setMessage("We couldn't sync. Please try again.");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const icon = (
    <svg
      className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
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
  );

  return (
    <div className="relative">
      {compact ? (
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          title="Sync categories"
          aria-label="Sync categories"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {icon}
        </button>
      ) : (
        <Button onClick={handleSync} disabled={syncing} variant="secondary" className="inline-flex items-center gap-2">
          {icon}
          {syncing ? "Syncing…" : "Sync categories"}
        </Button>
      )}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 left-0 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
