"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Clears the first-run flag (locally + on the account) and reopens the tour. */
export function ReplayTourButton({ storageKey, dashboardHref }: { storageKey: string; dashboardHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function replay() {
    setBusy(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/onboarded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
    } catch {
      /* ignore — localStorage clear is enough to replay this session */
    }
    router.push(dashboardHref);
  }

  return (
    <button
      type="button"
      onClick={replay}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {busy ? "Starting…" : "Replay the tour"}
    </button>
  );
}
