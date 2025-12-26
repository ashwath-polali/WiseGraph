// app/auth/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // If you later add email confirmation, you can restore:
      // options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Successfully created account. Redirecting to login...");
    setTimeout(() => {
      router.push("/auth/login");
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md px-4">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Sign up for WiseGraph
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

          {message && (
            <p className="text-xs text-emerald-400">
              {message}
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
              autoComplete="new-password"
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
            {submitting ? "Creating account..." : "Sign up"}
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
