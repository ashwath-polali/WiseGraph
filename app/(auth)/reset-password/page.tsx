"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify recovery token from URL 
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || type !== "recovery") {
      setError("This reset link isn't valid or has expired. Request a new one from the login page.");
      return;
    }

    (async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });

      if (error || !data.session) {
        setError(error?.message ?? "We couldn't verify this reset link. Request a new one from the login page.");
        return;
      }

      setIsReady(true);
    })();
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirm) {
      setError("These two passwords don't match. Type them again.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    // Force end of recovery session, then send user to login
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md space-y-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">
          Reset your password
        </h1>

        {!isReady && !error && (
          <p className="text-sm text-muted-foreground">
            Checking your reset link…
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        {isReady && !error && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                New password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Confirm password
              </label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {isSubmitting && (
              <p className="text-sm text-muted-foreground">
                Updating your password…
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
