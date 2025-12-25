// src/components/ResetPasswordClient.tsx
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ResetPasswordClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });         

      if (err) {
        setError(err.message);
        return;
      }
      setMessage("Reset link sent. Check your email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-[11px] text-slate-400">
          Password reset email
        </label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-xs"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Sends a reset link to this address.
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="text-xs"
        >
          {sending ? "Sending…" : "Send reset link"}
        </Button>
        <div className="text-[11px]">
          {error && <span className="text-red-400">{error}</span>}
          {message && <span className="text-emerald-400">{message}</span>}
        </div>
      </div>
    </div>
  );
}
