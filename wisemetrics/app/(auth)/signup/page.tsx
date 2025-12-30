'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
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
      // 1. Create Supabase auth user
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // 2. Create Teacher record with accountType
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
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

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-50 mb-3">
              Welcome to WiseGraph
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose your account type to get started with powerful assessment visualizations
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Teacher Card */}
            <button
              onClick={() => {
                setAccountType('teacher');
                setStep(2);
              }}
              className="group relative text-left p-8 rounded-2xl border-2 border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:border-sky-400 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-sky-500/10 flex items-center justify-center mb-5 group-hover:bg-sky-500/20 transition-colors">
                <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-slate-50 mb-2 group-hover:text-sky-400 transition-colors">
                  Teacher Account
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Perfect for classroom educators tracking multiple students
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Manage multiple classes and periods',
                  'Track patterns across many students',
                  'Class-level dashboards & analytics',
                  'Category and subskill configuration',
                  'Exploding radial visualizations',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Arrow indicator */}
              <div className="flex items-center gap-2 text-sky-400 font-medium group-hover:gap-3 transition-all">
                <span>Get Started</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>

            {/* Psychologist Card */}
            <button
              onClick={() => {
                setAccountType('psychologist');
                setStep(2);
              }}
              className="group relative text-left p-8 rounded-2xl border-2 border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-400 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-slate-50 mb-2 group-hover:text-emerald-400 transition-colors">
                  School Psychologist
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Designed for individual student evaluations & assessments
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Individual student evaluations',
                  'Single-student assessment focus',
                  'Polar & bell curve visualizations',
                  'Standard deviation overlays',
                  'Export charts for IEP reports',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Arrow indicator */}
              <div className="flex items-center gap-2 text-emerald-400 font-medium group-hover:gap-3 transition-all">
                <span>Get Started</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                Log in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <Card className="w-full max-w-md p-8 border-slate-700 shadow-2xl">
        {/* Back button */}
        <button
          onClick={() => {
            setStep(1);
            setError('');
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to account type</span>
        </button>

        {/* Header with icon */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl ${accountType === 'teacher' ? 'bg-sky-500/10' : 'bg-emerald-500/10'} flex items-center justify-center mx-auto mb-4`}>
            {accountType === 'teacher' ? (
              <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mb-2">
            Create your account
          </h1>
          <p className="text-slate-400 text-sm">
            {accountType === 'teacher' ? 'Teacher Account' : 'School Psychologist Account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
            <p className="text-xs text-slate-500 mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-sm bg-red-900/20 border border-red-800 rounded-lg p-4">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 text-base font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
