"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md px-4">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Log in to WiseGraph
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-6"
        >
          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">
              Password
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to WiseGraph
          </Link>
        </div>
      </div>
    </div>
  );
}
