'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'teacher' | 'psychologist'>('teacher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Email aliasing: teacher@domain.com vs teacher+psych@domain.com
      const authEmail = accountType === 'psychologist'
        ? email.replace('@', '+psych@')
        : email;

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError) throw signInError;

      // Route based on account type
      if (accountType === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/psych/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="relative min-h-dvh bg-background">
      {/* faint radial wash, top center — paper with light falling on it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.415_0.115_285/0.06),transparent)]"
      />

      {/* wordmark */}
      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="11" className="stroke-border" strokeWidth="1" />
            <path d="M12 12 L12 2.5 A9.5 9.5 0 0 1 20.2 7.3 Z" className="fill-primary" />
            <path d="M12 12 L20.2 7.3 A9.5 9.5 0 0 1 18.7 18.7 Z" className="fill-primary/45" />
            <path d="M12 12 L18.7 18.7 A9.5 9.5 0 0 1 5.3 18.7 Z" className="fill-psych/60" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight">WiseGraph</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </Link>
      </header>

      <main className="relative mx-auto flex w-full max-w-sm flex-col px-6 pt-14 pb-24 sm:pt-20">
        <h1 className="font-display text-[2.15rem] leading-tight font-medium text-foreground">
          Welcome back.
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Sign in to your WiseGraph account.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_16px_40px_-20px_oklch(0.245_0.015_75/0.18)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account type — segmented control */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-foreground/80">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAccountType('teacher')}
                  className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ${
                    accountType === 'teacher'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('psychologist')}
                  className={`rounded-md py-2 text-sm font-medium transition-all duration-200 ${
                    accountType === 'psychologist'
                      ? 'bg-card text-psych shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Psychologist
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-foreground/80">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="block text-[13px] font-medium text-foreground/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[13px] text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" disabled={loading} className="h-10 w-full text-sm font-medium">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to WiseGraph?{' '}
          <Link href="/signup" className="font-medium text-primary transition-colors hover:text-primary/80">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
