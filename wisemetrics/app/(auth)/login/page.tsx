"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Log in</h1>
      <p className="text-sm text-slate-400 mb-6">
        Sign in to view your class dashboards.
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
          {loading ? "Logging in…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
