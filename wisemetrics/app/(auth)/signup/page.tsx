'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type AccountType = 'teacher' | 'psychologist';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountType) return;

    setLoading(true);
    setError('');

    try {
      // Email aliasing: teacher@domain.com vs teacher+psych@domain.com
      const authEmail = accountType === 'psychologist'
        ? email.replace('@', '+psych@')
        : email;

      // 1. Create Supabase auth user with aliased email
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // 2. Create Teacher record with ORIGINAL email (can have duplicates)
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,  // Store original email, not aliased
          name,
          accountType,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // 3. Route based on account type
      if (accountType === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/psych/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const roleCard =
    'group relative flex flex-col rounded-xl border border-border bg-card p-7 text-left ' +
    'shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_16px_40px_-20px_oklch(0.245_0.015_75/0.18)] ' +
    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_24px_48px_-20px_oklch(0.245_0.015_75/0.22)] ' +
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 active:translate-y-0';

  if (step === 1) {
    return (
      <div className="relative min-h-dvh bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.415_0.115_285/0.06),transparent)]"
        />

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
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary transition-colors hover:text-primary/80">
              Log in
            </Link>
          </p>
        </header>

        <main className="relative mx-auto w-full max-w-3xl px-6 pt-12 pb-24 sm:pt-16">
          <h1 className="font-display text-[2.15rem] leading-tight font-medium text-foreground">
            Who's this account for?
          </h1>
          <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
            WiseGraph shapes itself around how you work with students.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {/* Teacher */}
            <button
              onClick={() => {
                setAccountType('teacher');
                setStep(2);
              }}
              className={roleCard}
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <svg className="h-5.5 w-5.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>

              <h2 className="text-lg font-semibold text-foreground">Teacher</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                For classroom educators tracking many students at once.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm text-muted-foreground">
                {[
                  'Classes, periods, and rosters',
                  'Class-level charts and comparisons',
                  'Categories and subskills you define',
                  'Snapshots to track growth over time',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Continue as a teacher
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>

            {/* Psychologist */}
            <button
              onClick={() => {
                setAccountType('psychologist');
                setStep(2);
              }}
              className={roleCard}
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-psych/10 text-psych">
                <svg className="h-5.5 w-5.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>

              <h2 className="text-lg font-semibold text-foreground">School psychologist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                For individual evaluations and parent conferences.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm text-muted-foreground">
                {[
                  'One evaluation per student',
                  'Subtest scores on the 60–150 scale',
                  'Polar and bell-curve views',
                  'Charts exported for IEP reports',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-psych/70" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-psych">
                Continue as a psychologist
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Step 2: Signup form
  return (
    <div className="relative min-h-dvh bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.415_0.115_285/0.06),transparent)]"
      />

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
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary transition-colors hover:text-primary/80">
            Log in
          </Link>
        </p>
      </header>

      <main className="relative mx-auto flex w-full max-w-sm flex-col px-6 pt-10 pb-24 sm:pt-14">
        <button
          onClick={() => {
            setStep(1);
            setError('');
          }}
          className="group mb-6 inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Account type
        </button>

        <h1 className="font-display text-[2.15rem] leading-tight font-medium text-foreground">
          Create your account.
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {accountType === 'teacher' ? 'Teacher' : 'School psychologist'} on WiseGraph.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_16px_40px_-20px_oklch(0.245_0.015_75/0.18)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-foreground/80">
                Full name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              <p className="mt-1.5 text-xs text-muted-foreground">
                The same email can hold both account types.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-foreground/80">
                Password
              </label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="h-10 w-full text-sm font-medium">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
