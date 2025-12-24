"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Depending on settings, Supabase might require email confirmation.
    // For now, just send user to login.
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Create account</h1>
      <p className="text-sm text-slate-400 mb-6">
        Get access to interactive assessment reports.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Email</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Password</label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>
    </div>
  );
}
