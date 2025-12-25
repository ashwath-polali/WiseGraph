// app/(auth)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        // If you later use magic link / email confirmation, set the redirectTo here:
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      console.error("Signup error", error);
      setErrorMsg(error.message);
      return;
    }

    // Depending on your Supabase settings, email confirmation may be required.
    // For now, send the user to login and let them sign in with the new account.
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
        >
          <h1 className="text-lg font-semibold text-slate-50">
            Create your WiseMetrics account
          </h1>
          <p className="text-xs text-slate-400">
            Use your school email so each teacher gets their own dashboard.
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Name
            </label>
            <Input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mr. Wiseman"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.org"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-200">
              Password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">
              {errorMsg}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !email || !password}
            className="w-full text-sm"
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>

          <p className="text-[11px] text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sky-400 hover:text-sky-300"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}
